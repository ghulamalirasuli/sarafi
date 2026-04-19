import React from 'react';

interface SystemHeaderProps {
    systemName: string;
    email: string;
    phone: string;
    address: string;
    logoUrl: string;
}

const SystemHeader: React.FC<SystemHeaderProps> = ({ systemName, email, phone, address, logoUrl }) => {
    return (
        <div className="system-header">
            <img src={logoUrl} alt={`${systemName} Logo`} className="system-logo" />
            <h1>{systemName}</h1>
            <p>Email: {email}</p>
            <p>Phone: {phone}</p>
            <p>Address: {address}</p>
        </div>
    );
};

export default SystemHeader;