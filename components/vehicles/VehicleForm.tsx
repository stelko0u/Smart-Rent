// import React, { useState } from 'react';

// const VehicleForm = ({
//   initialData,
//   onSubmit,
// }: {
//   initialData?: any;
//   onSubmit: (data: any) => void;
// }) => {
//   const [vehicleData, setVehicleData] = useState(
//     initialData || {
//       make: '',
//       model: '',
//       year: '',
//       price: '',
//       image: null,
//     },
//   );

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setVehicleData({
//       ...vehicleData,
//       [name]: value,
//     });
//   };

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setVehicleData({
//       ...vehicleData,
//       image: e.target.files?.[0] || null,
//     });
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     onSubmit(vehicleData);
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
//       <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
//         <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
//           Add Vehicle
//         </h2>

//         <form onSubmit={handleSubmit} className="space-y-5">
//           {/* Make */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-600 mb-1">
//               Make
//             </label>
//             <input
//               type="text"
//               name="make"
//               value={vehicleData.make}
//               onChange={handleChange}
//               required
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
//               placeholder="BMW"
//             />
//           </div>

//           {/* Model */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-600 mb-1">
//               Model
//             </label>
//             <input
//               type="text"
//               name="model"
//               value={vehicleData.model}
//               onChange={handleChange}
//               required
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
//               placeholder="M4 Competition"
//             />
//           </div>

//           {/* Year */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-600 mb-1">
//               Year
//             </label>
//             <input
//               type="number"
//               name="year"
//               value={vehicleData.year}
//               onChange={handleChange}
//               required
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
//               placeholder="2024"
//             />
//           </div>

//           {/* Price */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-600 mb-1">
//               Price per day
//             </label>
//             <input
//               type="number"
//               name="price"
//               value={vehicleData.price}
//               onChange={handleChange}
//               required
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
//               placeholder="$120"
//             />
//           </div>

//           {/* Image Upload */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-600 mb-1">
//               Upload Image
//             </label>
//             <input
//               type="file"
//               accept="image/*"
//               onChange={handleImageChange}
//               className="w-full text-sm border border-gray-300 rounded-lg cursor-pointer bg-gray-50 file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-blue-600 file:text-white file:rounded-md hover:file:bg-blue-700"
//             />
//           </div>

//           {/* Button */}
//           <button
//             type="submit"
//             className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 active:scale-[0.98] transition"
//           >
//             Add Vehicle
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };
// export default VehicleForm;
