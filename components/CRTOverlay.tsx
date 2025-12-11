import React from 'react';

const CRTOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden h-full w-full">
      {/* Scanlines defined in global CSS */}
      <div className="scanlines absolute inset-0 opacity-50"></div>
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0)50%,rgba(0,0,0,0.6)90%,rgba(0,0,0,1)100%)]"></div>
      
      {/* RGB Split hint (static) */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] mix-blend-screen pointer-events-none bg-red-500 translate-x-[1px]"></div>
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] mix-blend-screen pointer-events-none bg-blue-500 translate-x-[-1px]"></div>
    </div>
  );
};

export default CRTOverlay;