// src/components/CheckoutModal.tsx
"use client";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  quantity: number;
}

const CheckoutModal = ({ isOpen, onClose, quantity }: CheckoutModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    // Fundo semi-transparente
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="relative text-center p-3 border-b border-gray-200">
          <h5 className="text-lg font-semibold text-gray-700">Checkout</h5>
          <button onClick={onClose} className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <i className="bi bi-x text-2xl"></i>
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-4 space-y-4">
            <div className="bg-gray-100 p-3 rounded-md text-sm text-gray-500">
                <b className="text-gray-700">{quantity}</b> unidade(s) do produto <b className="text-gray-700">EDIÇÃO 76 - NOVO TERA 2026 0KM</b>
            </div>
            
            <form className="space-y-3">
                <div>
                    <label htmlFor="phone" className="block text-sm font-bold text-gray-800 mb-1">
                        Informe seu telefone
                    </label>
                    <input 
                        type="tel" 
                        id="phone" 
                        name="phone"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400"
                        placeholder="(00) 00000-0000"
                    />
                </div>
                <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 p-3 text-sm rounded-r-md">
                    <i className="bi bi-exclamation-circle-fill mr-2"></i>
                    Informe seu telefone para continuar.
                </div>
                <button 
                    type="submit" 
                    className="w-full bg-[#1db954] hover:bg-[#1aa34a] text-white font-bold py-3 px-4 rounded-lg flex justify-center items-center space-x-2 transition-colors"
                >
                    <span>Continuar</span>
                    <i className="bi bi-arrow-right"></i>
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
