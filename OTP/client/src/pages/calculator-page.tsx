import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Lead } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calculator,
  Home,
  TrendingUp,
  DollarSign,
  BarChart4,
  PiggyBank,
  Search
} from "lucide-react";

// FlipAnalysisTab Component
interface FlipAnalysisTabProps {
  selectedLead?: Lead | null;
}

const FlipAnalysisTab = ({ selectedLead }: FlipAnalysisTabProps) => {
  // Parse lead estimate from property value if available
  const leadEstimate = selectedLead?.estimatedValue ? parseFloat(selectedLead.estimatedValue.toString()) : undefined;
  
  const [purchasePrice, setPurchasePrice] = useState<number | undefined>(
    selectedLead ? (leadEstimate || undefined) : undefined
  );
  const [repairCosts, setRepairCosts] = useState<number | undefined>(undefined);
  const [closingCosts, setClosingCosts] = useState<number | undefined>(undefined);
  const [holdingCosts, setHoldingCosts] = useState<number | undefined>(undefined);
  const [sellingCosts, setSellingCosts] = useState<number | undefined>(undefined);
  const [afterRepairValue, setAfterRepairValue] = useState<number | undefined>(
    selectedLead ? (leadEstimate ? leadEstimate * 1.3 : undefined) : undefined
  );
  
  // Calculated values
  const purchasePriceValue = purchasePrice || 0;
  const repairCostsValue = repairCosts || 0;
  const closingCostsValue = closingCosts || 0;
  const holdingCostsValue = holdingCosts || 0;
  const sellingCostsValue = sellingCosts || 0;
  const arvValue = afterRepairValue || 0;
  
  const totalInvestment = purchasePriceValue + repairCostsValue + closingCostsValue + holdingCostsValue + sellingCostsValue;
  const profit = arvValue - totalInvestment;
  const roi = totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0;
  const seventyPercentRule = arvValue * 0.7 - repairCostsValue;
  const isGoodDeal = purchasePriceValue <= seventyPercentRule;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Inputs */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purchase-price" className="flex justify-between items-center">
                <span>Purchase Price ($)</span>
                {selectedLead && <span className="text-xs text-muted-foreground">From property estimate</span>}
              </Label>
              <Input 
                id="purchase-price" 
                type="number" 
                min="0"
                value={purchasePrice || ''}
                onChange={(e) => setPurchasePrice(Number(e.target.value))}
                className="text-lg bg-background dark:bg-neutral-800/50 focus:ring-primary border-neutral-300 dark:border-neutral-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="repair-costs">Repair Costs ($)</Label>
              <Input 
                id="repair-costs" 
                type="number" 
                min="0"
                value={repairCosts || ''}
                onChange={(e) => setRepairCosts(Number(e.target.value))}
                className="text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="closing-costs">Closing Costs ($)</Label>
              <Input 
                id="closing-costs" 
                type="number" 
                min="0"
                value={closingCosts || ''}
                onChange={(e) => setClosingCosts(Number(e.target.value))}
                className="text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="holding-costs">Holding Costs ($)</Label>
              <Input 
                id="holding-costs" 
                type="number" 
                min="0"
                value={holdingCosts || ''}
                onChange={(e) => setHoldingCosts(Number(e.target.value))}
                className="text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="selling-costs">Selling Costs ($)</Label>
              <Input 
                id="selling-costs" 
                type="number" 
                min="0"
                value={sellingCosts || ''}
                onChange={(e) => setSellingCosts(Number(e.target.value))}
                className="text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="arv" className="flex justify-between items-center">
                <span>After Repair Value (ARV) ($)</span>
                {selectedLead && <span className="text-xs text-muted-foreground">Estimated at 130% of property value</span>}
              </Label>
              <Input 
                id="arv" 
                type="number" 
                min="0"
                value={afterRepairValue || ''}
                onChange={(e) => setAfterRepairValue(Number(e.target.value))}
                className="text-lg bg-background dark:bg-neutral-800/50 focus:ring-primary border-neutral-300 dark:border-neutral-700"
              />
            </div>
          </div>
        </div>
        
        {/* Right Column - Results */}
        <div className="bg-neutral-50 dark:bg-neutral-800/80 p-5 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700">
          <h3 className="text-xl font-semibold mb-4 high-emphasis">Investment Analysis</h3>
          <p className="text-sm text-muted-foreground mb-4">Review your potential returns</p>
          
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
              <span>Total Investment:</span>
              <span className="font-semibold high-emphasis currency-value">${totalInvestment.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
              <span>After Repair Value:</span>
              <span className="font-semibold high-emphasis currency-value">${arvValue.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
              <span>Selling Costs:</span>
              <span className="font-semibold high-emphasis currency-value">${sellingCostsValue.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
              <span className="font-medium">Potential Profit:</span>
              <span className={`font-semibold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} currency-value`}>
                ${profit.toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
              <span className="font-medium">ROI:</span>
              <span className={`font-semibold ${roi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} currency-value`}>
                {roi.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="mt-6 bg-neutral-100/50 dark:bg-neutral-800/30 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <h4 className="text-lg font-medium mb-3 high-emphasis">70% Rule Check</h4>
            <p className="text-sm text-muted-foreground mb-3">Max Purchase Price = ARV x 70% - Repairs</p>
            
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                <span className="font-medium">Max Purchase Price:</span>
                <span className="font-semibold high-emphasis currency-value">${seventyPercentRule.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                <span className="font-medium">Your Purchase Price:</span>
                <span className="font-semibold high-emphasis currency-value">${purchasePriceValue.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                <span className="font-medium">Good Deal?</span>
                <span className={`font-semibold ${isGoodDeal ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isGoodDeal ? 'Yes ✓' : 'No ✕'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// FinancingAnalysisTab Component
interface FinancingAnalysisTabProps {
  selectedLead?: Lead | null;
}

const FinancingAnalysisTab = ({ selectedLead }: FinancingAnalysisTabProps) => {
  // Parse lead estimate from property value if available
  const leadEstimate = selectedLead?.estimatedValue ? parseFloat(selectedLead.estimatedValue.toString()) : undefined;
  
  const [propertyValue, setPropertyValue] = useState<number | undefined>(
    selectedLead ? (leadEstimate || undefined) : undefined
  );
  const [downPayment, setDownPayment] = useState<number | undefined>(
    propertyValue ? propertyValue * 0.2 : undefined
  );
  const [loanAmount, setLoanAmount] = useState<number | undefined>(
    propertyValue && downPayment ? propertyValue - downPayment : undefined
  );
  const [interestRate, setInterestRate] = useState<number | undefined>(6.5);
  const [loanTerm, setLoanTerm] = useState<number>(30);
  
  // Calculated values
  const loanAmountValue = loanAmount || 0;
  const interestRateValue = interestRate || 0;
  const downPaymentValue = downPayment || 0;
  const propertyValueValue = propertyValue || 0;
  
  const monthlyInterestRate = interestRateValue / 100 / 12;
  const numberOfPayments = loanTerm * 12;
  const monthlyPayment = 
    loanAmountValue > 0 && monthlyInterestRate > 0 && numberOfPayments > 0 
      ? (loanAmountValue * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / 
        (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1)
      : 0;
  const totalLoanCost = monthlyPayment * numberOfPayments;
  const totalInterest = totalLoanCost - loanAmountValue;
  const ltv = propertyValueValue > 0 ? (loanAmountValue / propertyValueValue) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Inputs */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium mb-2">Financing Details</h3>
            <p className="text-sm text-muted-foreground mb-4">Enter your loan information</p>
            
            <div className="space-y-2">
              <Label htmlFor="loan-amount">Loan Amount ($)</Label>
              <Input 
                id="loan-amount" 
                type="number" 
                min="0"
                value={loanAmount || ''}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="down-payment">Down Payment ($)</Label>
              <Input 
                id="down-payment" 
                type="number" 
                min="0"
                value={downPayment || ''}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                className="text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="interest-rate">Interest Rate (%)</Label>
              <Input 
                id="interest-rate" 
                type="number" 
                min="0"
                max="30"
                step="0.1"
                value={interestRate || ''}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="loan-term">Loan Term (Years)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  type="button" 
                  className={loanTerm === 15 ? "bg-primary text-primary-foreground" : "bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600"}
                  onClick={() => setLoanTerm(15)}
                >
                  15 years
                </Button>
                <Button 
                  type="button" 
                  className={loanTerm === 30 ? "bg-primary text-primary-foreground" : "bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600"}
                  onClick={() => setLoanTerm(30)}
                >
                  30 years
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Results */}
        <div className="bg-neutral-50 dark:bg-neutral-800 p-5 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Financing Summary</h3>
          <p className="text-sm text-muted-foreground mb-4">Review your loan payments</p>
          
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
              <span>Monthly Payment:</span>
              <div className="text-right">
                <div className="font-semibold high-emphasis currency-value">${monthlyPayment.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">Principal + Interest</div>
              </div>
            </div>
            
            <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
              <span>Down Payment</span>
              <span className="font-semibold">${downPaymentValue.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
              <span>Total Loan Amount</span>
              <span className="font-semibold">${loanAmountValue.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
              <span>Loan-to-Value (LTV)</span>
              <span className="font-semibold">{ltv.toFixed(1)}%</span>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="text-lg font-medium mb-3">Loan Summary</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                <span>Loan Term:</span>
                <span className="font-semibold">{loanTerm} years</span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                <span>Monthly Payment:</span>
                <span className="font-semibold high-emphasis currency-value">${monthlyPayment.toFixed(0)}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                <span>Total Payments:</span>
                <span className="font-semibold high-emphasis currency-value">${totalLoanCost.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                <span>Total Interest:</span>
                <span className="font-semibold high-emphasis currency-value">${totalInterest.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// RentalAnalysisTab Component
interface RentalAnalysisTabProps {
  selectedLead?: Lead | null;
}

const RentalAnalysisTab = ({ selectedLead }: RentalAnalysisTabProps) => {
  // Parse lead estimate from property value if available
  const leadEstimate = selectedLead?.estimatedValue ? parseFloat(selectedLead.estimatedValue.toString()) : undefined;
  
  const [purchasePrice, setPurchasePrice] = useState<number | undefined>(
    selectedLead ? (leadEstimate || undefined) : undefined
  );
  const [monthlyRent, setMonthlyRent] = useState<number | undefined>(
    purchasePrice ? Math.round(purchasePrice * 0.008) : undefined // Rough estimate of rent at 0.8% of property value
  );
  const [propertyTaxes, setPropertyTaxes] = useState<number | undefined>(
    purchasePrice ? Math.round(purchasePrice * 0.015 / 12) : undefined // Estimated monthly property taxes
  );
  const [propertyInsurance, setPropertyInsurance] = useState<number | undefined>(
    purchasePrice ? Math.round(purchasePrice * 0.005 / 12) : undefined // Estimated monthly insurance
  );
  const [propertyManagement, setPropertyManagement] = useState<number | undefined>(
    monthlyRent ? Math.round(monthlyRent * 0.1) : undefined // 10% of rent
  );
  const [maintenance, setMaintenance] = useState<number | undefined>(
    monthlyRent ? Math.round(monthlyRent * 0.05) : undefined // 5% of rent
  );
  const [vacancy, setVacancy] = useState<number | undefined>(
    monthlyRent ? Math.round(monthlyRent * 0.05) : undefined // 5% of rent
  );
  const [capEx, setCapEx] = useState<number | undefined>(
    monthlyRent ? Math.round(monthlyRent * 0.05) : undefined // 5% of rent
  );
  const [mortgagePayment, setMortgagePayment] = useState<number | undefined>(
    purchasePrice ? Math.round((purchasePrice * 0.8 * 0.065 / 12) / (1 - Math.pow(1 + 0.065/12, -360))) : undefined
  ); // Estimated monthly mortgage payment based on 30-year loan at 6.5% with 20% down
  
  // Safe values with defaults
  const purchasePriceValue = purchasePrice || 0;
  const monthlyRentValue = monthlyRent || 0;
  const propertyTaxesValue = propertyTaxes || 0;
  const propertyInsuranceValue = propertyInsurance || 0;
  const propertyManagementValue = propertyManagement || 0;
  const maintenanceValue = maintenance || 0;
  const vacancyValue = vacancy || 0;
  const capExValue = capEx || 0;
  const mortgagePaymentValue = mortgagePayment || 0;
  
  // Calculated values
  const annualRent = monthlyRentValue * 12;
  const vacancyLoss = (vacancyValue / 100) * annualRent;
  const managementCost = (propertyManagementValue / 100) * annualRent;
  const maintenanceCost = (maintenanceValue / 100) * annualRent;
  const capExCost = (capExValue / 100) * annualRent;
  
  const annualExpenses = propertyTaxesValue + propertyInsuranceValue + managementCost + maintenanceCost + vacancyLoss + capExCost;
  const netOperatingIncome = annualRent - annualExpenses;
  const annualCashFlow = netOperatingIncome - mortgagePaymentValue;
  const monthlyCashFlow = annualCashFlow / 12;
  const capRate = purchasePriceValue > 0 ? (netOperatingIncome / purchasePriceValue) * 100 : 0;
  const onePercentRule = purchasePriceValue > 0 ? (monthlyRentValue / purchasePriceValue) * 100 : 0;
  const passesOnePercentRule = onePercentRule >= 1;
  const cashOnCashReturn = purchasePriceValue > 0 ? (annualCashFlow / (purchasePriceValue * 0.2)) * 100 : 0; // Assuming 20% down
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Inputs */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium mb-2">Rental Property Details</h3>
            <p className="text-sm text-muted-foreground mb-4">Enter your rental property information</p>
            
            <div className="space-y-2">
              <Label htmlFor="monthly-rent">Monthly Rent ($)</Label>
              <Input 
                id="monthly-rent" 
                type="number" 
                min="0"
                value={monthlyRent || ''}
                onChange={(e) => setMonthlyRent(Number(e.target.value))}
                className="text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="annual-property-tax">Annual Property Tax ($)</Label>
              <Input 
                id="annual-property-tax" 
                type="number" 
                min="0"
                value={propertyTaxes || ''}
                onChange={(e) => setPropertyTaxes(Number(e.target.value))}
                className="text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="annual-maintenance">Annual Maintenance ($)</Label>
              <Input 
                id="annual-maintenance" 
                type="number" 
                min="0"
                value={maintenanceCost || ''}
                onChange={(e) => setMaintenance(Number(e.target.value) / annualRent * 100)}
                className="text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vacancy-rate">Vacancy Rate (%)</Label>
              <Input 
                id="vacancy-rate" 
                type="number" 
                min="0"
                max="100"
                value={vacancy || ''}
                onChange={(e) => setVacancy(Number(e.target.value))}
                className="text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="annual-insurance">Annual Insurance ($)</Label>
              <Input 
                id="annual-insurance" 
                type="number" 
                min="0"
                value={propertyInsurance || ''}
                onChange={(e) => setPropertyInsurance(Number(e.target.value))}
                className="text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="management-fee">Management Fee (%)</Label>
              <Input 
                id="management-fee" 
                type="number" 
                min="0"
                max="100"
                value={propertyManagement || ''}
                onChange={(e) => setPropertyManagement(Number(e.target.value))}
                className="text-lg"
              />
            </div>
          </div>
        </div>
        
        {/* Right Column - Results */}
        <div className="bg-neutral-50 dark:bg-neutral-800 p-5 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Rental Analysis</h3>
          <p className="text-sm text-muted-foreground mb-4">Review your rental investment metrics</p>
          
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="text-center p-3 bg-neutral-100 dark:bg-neutral-700 rounded">
              <div className="text-sm text-muted-foreground">Monthly Rent</div>
              <div className="font-semibold">${monthlyRentValue.toLocaleString()}</div>
            </div>
            <div className="text-center p-3 bg-neutral-100 dark:bg-neutral-700 rounded">
              <div className="text-sm text-muted-foreground">Annual Rent</div>
              <div className="font-semibold">${annualRent.toLocaleString()}</div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Annual Expenses</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Property Tax:</span>
                  <span>${propertyTaxesValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Insurance:</span>
                  <span>${propertyInsuranceValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Maintenance:</span>
                  <span>${maintenanceCost.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Vacancy Loss ({vacancyValue}%):</span>
                  <span>${vacancyLoss.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Management ({propertyManagementValue}%):</span>
                  <span>${managementCost.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
                <div className="flex justify-between text-sm font-medium mt-1 pt-1 border-t border-neutral-200 dark:border-neutral-700">
                  <span>Total Expenses:</span>
                  <span>${annualExpenses.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
              </div>
            </div>
            
            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Net Operating Income (NOI):</span>
                  <span className="font-semibold">${netOperatingIncome.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual Mortgage Payment:</span>
                  <span className="font-semibold">${mortgagePaymentValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Annual Cash Flow:</span>
                  <span className={annualCashFlow >= 0 ? "text-green-600" : "text-red-600"}>
                    ${annualCashFlow.toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly Cash Flow:</span>
                  <span className={monthlyCashFlow >= 0 ? "text-green-600" : "text-red-600"}>
                    ${monthlyCashFlow.toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Cap Rate:</span>
                  <span className="font-semibold">{capRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash-on-Cash Return:</span>
                  <span className={cashOnCashReturn >= 0 ? "font-semibold" : "font-semibold text-red-600"}>
                    {cashOnCashReturn.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>1% Rule:</span>
                  <span className={`font-semibold ${passesOnePercentRule ? "text-green-600" : "text-red-600"}`}>
                    {passesOnePercentRule ? "Pass ✓" : `Fail ✗(${onePercentRule.toFixed(1)}%)`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CalculatorPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("flip");
  const [isLeadSearchOpen, setIsLeadSearchOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // Fetch leads data for selection
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });
  
  // Handle selecting a lead for the calculator
  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsLeadSearchOpen(false);
  };
  
  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-neutral-900 dark:text-neutral-100">Real Estate Calculators</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Analyze properties and make data-driven decisions</p>
        </div>
        
        {/* Lead Selection */}
        <div className="flex items-center space-x-2">
          <Dialog open={isLeadSearchOpen} onOpenChange={setIsLeadSearchOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Search className="mr-2 h-4 w-4" />
                {selectedLead ? "Change Property" : "Select Property"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Select Property for Analysis</DialogTitle>
              </DialogHeader>
              <Command>
                <CommandInput placeholder="Search properties..." />
                <CommandList>
                  <CommandEmpty>No properties found.</CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-72">
                      {leads.map((lead) => (
                        <CommandItem
                          key={lead.id}
                          value={`${lead.ownerName}-${lead.propertyAddress}`}
                          onSelect={() => handleSelectLead(lead)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{lead.ownerName}</span>
                            <span className="text-xs text-neutral-500">
                              {lead.propertyAddress}
                            </span>
                            <span className="text-xs text-neutral-500">
                              {lead.estimatedValue ? `$${parseFloat(lead.estimatedValue.toString()).toLocaleString()}` : 'No value estimate'}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </ScrollArea>
                  </CommandGroup>
                </CommandList>
              </Command>
            </DialogContent>
          </Dialog>
          
          {selectedLead && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedLead(null)}
              className="text-red-500 hover:text-red-700"
            >
              Clear
            </Button>
          )}
        </div>
      </div>
      
      {/* Selected Property Card */}
      {selectedLead && (
        <Card className="mb-4 border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row justify-between">
              <div>
                <h3 className="text-lg font-medium">{selectedLead.propertyAddress}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedLead.city}, {selectedLead.state} {selectedLead.zip}
                </p>
              </div>
              <div className="mt-2 md:mt-0">
                <span className="text-sm text-muted-foreground">Estimated Value: </span>
                <span className="font-medium">
                  {selectedLead.estimatedValue 
                    ? `$${parseFloat(selectedLead.estimatedValue.toString()).toLocaleString()}` 
                    : 'Not available'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Calculator Card */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center">
            <Calculator className="mr-2 h-5 w-5 text-primary" />
            <CardTitle>Investment Analysis Tools</CardTitle>
          </div>
          <CardDescription>
            Calculate potential returns for different real estate investment strategies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="flip" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="flip" className="flex items-center">
                <Home className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Flip Analysis</span>
                <span className="sm:hidden">Flip</span>
              </TabsTrigger>
              <TabsTrigger value="financing" className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Financing</span>
                <span className="sm:hidden">Finance</span>
              </TabsTrigger>
              <TabsTrigger value="rental" className="flex items-center">
                <PiggyBank className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Rental Analysis</span>
                <span className="sm:hidden">Rental</span>
              </TabsTrigger>
            </TabsList>
            <div className="mt-6">
              <TabsContent value="flip">
                <FlipAnalysisTab selectedLead={selectedLead} />
              </TabsContent>
              <TabsContent value="financing">
                <FinancingAnalysisTab selectedLead={selectedLead} />
              </TabsContent>
              <TabsContent value="rental">
                <RentalAnalysisTab selectedLead={selectedLead} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Tips */}
      <Card>
        <CardHeader>
          <div className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-primary" />
            <CardTitle>Investment Tips</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium">Flipping Properties</h3>
              <p className="text-sm text-muted-foreground">
                Use the 70% rule: Maximum purchase price should be 70% of ARV minus repair costs.
                Pay attention to holding costs which can significantly impact your profits.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Financing Decisions</h3>
              <p className="text-sm text-muted-foreground">
                Higher down payments reduce monthly costs but tie up capital. 
                Consider opportunity costs when deciding loan terms. Aim for LTV under 80% for best rates.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Rental Property Analysis</h3>
              <p className="text-sm text-muted-foreground">
                The 1% rule suggests monthly rent should be at least 1% of purchase price.
                Don't underestimate vacancies and maintenance costs - they're often higher than expected.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}