import React, { useState } from 'react';
import LogoUpload from '../components/LogoUpload';
import SystemHeader from '../components/SystemHeader';

const SystemSetup: React.FC = () => {
    const [systemName, setSystemName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [logo, setLogo] = useState<File | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission logic here, such as sending data to the server
    };

    return (
        <div>
            <h1>System Setup</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>System Name:</label>
                    <input
                        type="text"
                        value={systemName}
                        onChange={(e) => setSystemName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Phone:</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Address:</label>
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                    />
                </div>
                <LogoUpload onLogoUpload={setLogo} />
                <button type="submit">Save System Info</button>
            </form>
            <SystemHeader systemName={systemName} email={email} phone={phone} address={address} logo={logo} />
            {/* Here you can add the ledger or other records display */}
        </div>
    );
};

export default SystemSetup;