import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { processPayment } from '../../lib/stripe';

const PaymentForm = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            await processPayment(data);
            toast.success('Payment successful!');
        } catch (error) {
            toast.error('Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">Card Number</label>
                <input
                    type="text"
                    id="cardNumber"
                    {...register('cardNumber', { required: 'Card number is required' })}
                    className={`mt-1 block w-full border ${errors.cardNumber ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring focus:ring-opacity-50`}
                />
                {errors.cardNumber && <p className="text-red-500 text-sm">{errors.cardNumber.message}</p>}
            </div>
            <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">Expiry Date</label>
                <input
                    type="text"
                    id="expiryDate"
                    {...register('expiryDate', { required: 'Expiry date is required' })}
                    className={`mt-1 block w-full border ${errors.expiryDate ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring focus:ring-opacity-50`}
                />
                {errors.expiryDate && <p className="text-red-500 text-sm">{errors.expiryDate.message}</p>}
            </div>
            <div>
                <label htmlFor="cvc" className="block text-sm font-medium text-gray-700">CVC</label>
                <input
                    type="text"
                    id="cvc"
                    {...register('cvc', { required: 'CVC is required' })}
                    className={`mt-1 block w-full border ${errors.cvc ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring focus:ring-opacity-50`}
                />
                {errors.cvc && <p className="text-red-500 text-sm">{errors.cvc.message}</p>}
            </div>
            <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 px-4 bg-blue-600 text-white rounded-md ${loading ? 'opacity-50' : 'hover:bg-blue-700'}`}
            >
                {loading ? 'Processing...' : 'Pay Now'}
            </button>
        </form>
    );
};

export default PaymentForm;