// components/FileUpload.jsx
import { Plus } from 'lucide-react';

const FileUpload = () => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("File selected:", file.name);
      // Trigger upload logic here
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-64 h-64 flex flex-col justify-between">
      <h2 className="text-2xl font-bold text-gray-800">Send</h2>
      <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg flex-grow mt-4 hover:border-pink-500 transition">
        <Plus size={48} className="text-pink-500" />
        <input type="file" className="hidden" onChange={handleFileChange} />
      </label>
    </div>
  );
};