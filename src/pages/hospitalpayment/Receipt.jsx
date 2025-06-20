import React from 'react';
import { Page, Text, View, Document, StyleSheet, BlobProvider } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Courier',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 10,
  },
});

const Receipt = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text>Hospital Payment Receipt</Text>
        <Text>-----------------------------------</Text>
      </View>
      <View style={styles.section}>
        <Text>Card Number : {data.cardNumber}</Text>
        <Text>
          Amount :{' '}
          {data.amount
            ?.map((item) => item.Amount)
            .reduce((a, b) => parseFloat(a) + parseFloat(b), 0)}
        </Text>
        <Text>Method : {data.method}</Text>
        {data.method === 'Digital' && <Text>Channel : {data.digitalChannel}</Text>}
        {data.method === 'CBHI' && <Text>Woreda : {data.woreda}</Text>}
        {data.method === 'Credit' && <Text>Organization : {data.organization}</Text>}
        <Text>
          Reason :{' '}
          {Array.isArray(data.reason) ? data.reason.join(', ') : 'N/A'}
        </Text>
        <Text>Description : {data.description}</Text>
        <Text>Date : {new Date().toLocaleDateString()}</Text>
      </View>
      <View style={styles.header}>
        <Text>-----------------------------------</Text>
        <Text>Thank you for your visit!</Text>
        <Text>-----------------------------------</Text>
      </View>
    </Page>
  </Document>
);

export default Receipt;
