import { addWithdrawMethod } from './withdraw-methods-service';

export const addTestWithdrawalMethods = async () => {
  const testMethods = [
    {
      name: "bKash",
      receiverInfo: "Personal: 01712345678",
      feePercentage: 2.5,
      minAmount: 50,
      maxAmount: 5000,
      status: "active" as const
    },
    {
      name: "Nagad",
      receiverInfo: "Personal: 01812345678",
      feePercentage: 2.0,
      minAmount: 100,
      maxAmount: 10000,
      status: "active" as const
    },
    {
      name: "Rocket",
      receiverInfo: "Personal: 01912345678",
      feePercentage: 3.0,
      minAmount: 50,
      maxAmount: 3000,
      status: "active" as const
    }
  ];

  try {
    for (const method of testMethods) {
      const result = await addWithdrawMethod(method);
      if (result.success) {
        console.log(`Added ${method.name} withdrawal method`);
      } else {
        console.error(`Failed to add ${method.name}:`, result.error);
      }
    }
    console.log('Test withdrawal methods added successfully!');
    return { success: true };
  } catch (error) {
    console.error('Error adding test methods:', error);
    return { success: false, error: error.message };
  }
};