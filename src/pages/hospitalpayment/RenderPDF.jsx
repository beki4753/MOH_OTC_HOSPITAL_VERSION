import React from 'react';

const RenderPDF = ({ html }) => {
  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: html }}></div>
    </div>
  );
};

export default RenderPDF;
