import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/dashboard";
import Bar from "../pages/bar";
import Form from "../pages/form";
import Line from "../pages/line";
import Pie from "../pages/pie";
import FAQ from "../pages/faq";
import Login from "../pages/login";
import Geography from "../pages/geography";
import Calendar from "../pages/calendar/calendar";
// import Logout from "./logout";
 const Routing  =() =>{

    <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/form" element={<Form />} />
        <Route path="/bar" element={<Bar />} />
        <Route path="/pie" element={<Pie />} />
        <Route path="/line" element={<Line />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/geography" element={<Geography />} />
        {/* <Route path="/logout" element={<Logout />} /> */}
    </Routes>
}
export default Routing;