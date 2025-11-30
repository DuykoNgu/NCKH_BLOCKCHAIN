import { useNavigate } from 'react-router-dom';

export default function CreateWallet() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center w-full">
      <button
        className="bg-white text-black px-10 py-3 rounded-xl text-lg font-semibold mb-4 w-[400px] transition duration-300 hover:scale-105 active:scale-95"
        onClick={() => navigate('/login/new')}
      >
        Tạo ví mới
      </button>

      <button
        className="bg-black text-white px-10 py-3 rounded-xl text-lg font-semibold w-[400px] transition duration-300 hover:scale-105 active:scale-95"
        onClick={() => navigate('/login/existing')}
      >
        Tôi đã có ví
      </button>
    </div>
  );
}