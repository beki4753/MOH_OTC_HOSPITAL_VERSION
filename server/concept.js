const express = require("express");
const { pool, poolConnect, sql } = require("./db");
const api = require("./api");
const router = express.Router();
const jwt = require("jsonwebtoken");

/**
 * Recursively collect all member UUIDs from a concept set.
 * @param {string} rootUuid
 * @param {Set} visited
 * @returns {Set} of UUIDs including rootUuid and all nested members
 */
const collectAllMembersRecursively = async (rootUuid, visited = new Set()) => {
  if (!rootUuid || visited.has(rootUuid)) return visited;
  visited.add(rootUuid);

  const res = await api.get(`/concept/${rootUuid}`, { params: { v: "full" } });
  const setMembers = res.data.setMembers || [];

  for (const member of setMembers) {
    await collectAllMembersRecursively(member.uuid, visited);
  }
  return visited;
};

/**
 * Fetch all concepts paginated.
 */
const fetchAllConcepts = async () => {
  const limit = 1000;
  let startIndex = 0;
  let allConcepts = [];

  while (true) {
    const response = await api.get("/concept", {
      params: {
        q: "",
        v: "custom:(uuid,display,name,conceptClass,datatype,set,retired)",
        limit,
        startIndex,
      },
    });

    const batch = response.data.results || [];
    if (!batch.length) break;

    allConcepts.push(...batch);
    if (batch.length < limit) break;

    startIndex += limit;
  }

  return allConcepts;
};

router.get("/sync-concepts", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  await poolConnect;

  try {
    const token = authHeader.split(" ")[1]; // Extract token after "Bearer "

    const decoded = jwt.decode(token);

    const username = decoded?.name;

    // 1. Find the "All Order" concept set by exact name (case-insensitive)
    const searchName = "All Orderables";

    const searchRes = await api.get("/concept", {
      params: {
        q: searchName,
        v: "custom:(uuid,display,set,retired,conceptClass)",
        limit: 50,
      },
    });

    const candidates = (searchRes.data.results || []).filter(
      (c) =>
        c.set === true &&
        !c.retired &&
        c.display.toLowerCase() === searchName.toLowerCase()
    );

    if (candidates.length === 0) {
      return res
        .status(404)
        .json({ error: `"${searchName}" concept set not found.` });
    }

    const allOrderSet = candidates[0];
    console.log(`Found "All Order" set UUID: ${allOrderSet.uuid}`);

    // 2. Recursively collect all allowed UUIDs under "All Order"
    const allowedUuidsSet = await collectAllMembersRecursively(
      allOrderSet.uuid
    );
    allowedUuidsSet.add(allOrderSet.uuid); // include root itself

    // 3. Fetch all concepts
    const allConcepts = await fetchAllConcepts();
    console.log(`Total concepts fetched: ${allConcepts.length}`);

    // 4. Filter concepts to only those allowed by UUID
    const allowedConcepts = allConcepts.filter((c) =>
      allowedUuidsSet.has(c.uuid)
    );

    // 5. Separate set and non-set concepts (including retired)
    const setConcepts = allowedConcepts.filter(
      (c) => c.set === true && !c.retired
    );
    const nonSetConcepts = allowedConcepts.filter((c) => !c.set);

    // 6. Identify LabSet panels only (active)
    const labSetPanels = setConcepts.filter(
      (c) => c.conceptClass?.display === "LabSet"
    );
    console.log(
      `Allowed LabSet panels count (active only): ${labSetPanels.length}`
    );

    // 7. Collect all active member UUIDs of allowed LabSet panels
    const panelMemberUuids = new Set();

    for (const panel of labSetPanels) {
      try {
        const detailRes = await api.get(`/concept/${panel.uuid}`, {
          params: { v: "full" },
        });
        const activeMembers = (detailRes.data.setMembers || []).filter(
          (m) => !m.retired
        );

        activeMembers.forEach((m) => panelMemberUuids.add(m.uuid));
      } catch (e) {
        console.error(
          `Failed to fetch members for panel ${panel.display}:`,
          e.message
        );
      }
    }

    // 8. Filter standalone concepts:
    // Include:
    // - Non-set concepts that are NOT active panel members
    // - OR concepts that are retired (even if panel members)
    const standaloneConcepts = nonSetConcepts.filter((c) => {
      if (panelMemberUuids.has(c.uuid)) {
        return c.retired === true; // include if retired
      }
      return true; // include if not a panel member
    });

    console.log(
      `Standalone concepts count (including retired): ${standaloneConcepts.length}`
    );

    // 10. Final list to sync = allowed active LabSet panels + standalone concepts (including retired)
    const finalConcepts = [...labSetPanels, ...standaloneConcepts];
    console.log(`Final concepts to sync: ${finalConcepts.length}`);

    // 11. Upsert each concept into the database
    for (const concept of finalConcepts) {
      const name =
        concept.name?.name || concept.display || concept.name?.display || "";

      if (!name || typeof name !== "string") {
        console.warn(`Skipped concept (no valid name): ${concept.uuid}`);
        continue;
      }

      const request = pool.request();
      await request
        .input("uuid", sql.VarChar, concept.uuid)
        .input("displayName", sql.NVarChar, concept.display || "")
        .input("createdBy", sql.NVarChar, username || "")
        .input(
          "conceptClassDisplay",
          sql.NVarChar,
          concept.conceptClass?.display || ""
        )
        .input("isSet", sql.Bit, concept.set === true)
        .execute(`SP_DUMPTESTS`);
    }

    res.status(200).json({
      message: `✅ Synced ${finalConcepts.length} concepts (allowed panels + standalone including retired).`,
    });
  } catch (error) {
    console.error("❌ Sync Error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to sync concepts", details: error.message });
  }
});

module.exports = router;
