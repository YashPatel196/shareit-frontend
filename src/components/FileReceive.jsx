// components/FileReceive.jsx
const FileReceive = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg w-64 mt-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Receive</h2>
      <div className="flex border-b-2 border-gray-200 focus-within:border-pink-500 transition">
        <input 
          type="text" 
          placeholder="Input key" 
          className="w-full py-2 outline-none"
        />
        <button className="text-gray-400">⬇️</button>
      </div>
    </div>
  );
};