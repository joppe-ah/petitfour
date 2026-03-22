export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  monthlyContribution: number;
  color: string;
  emoji: string;
  createdAt: Date;
  targetDate?: Date;
}
