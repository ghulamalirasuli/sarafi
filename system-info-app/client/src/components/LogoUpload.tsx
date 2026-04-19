import React, { useState } from 'react';

const LogoUpload: React.FC<{ onLogoUpload: (file: File) => void }> = ({ onLogoUpload }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            onLogoUpload(file);
        }
    };

    const handleUpload = () => {
        if (selectedFile) {
            // Logic to upload the file can be added here
            console.log('Uploading:', selectedFile.name);
        }
    };

    return (
        <div>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {selectedFile && (
                <div>
                    <p>Selected file: {selectedFile.name}</p>
                    <button onClick={handleUpload}>Upload Logo</button>
                </div>
            )}
        </div>
    );
};

export default LogoUpload;