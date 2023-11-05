/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Chart({ jsonData }) {
  // State variables to store the counts
  const [approvedCount, setApprovedCount] = useState(0);
  const [pmiRequiredCount, setPmiRequiredCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  useEffect(() => {
    jsonData.forEach((item) => {
      const {
        loanAmount,
        appraisedValue,
        creditScore,
        grossMonthlyIncome,
        monthlyMortgagePayment,
      } = item;

      const LTV = (item.LoanAmount / item.AppraisedValue) * 100;
      const DTI =
        ((item.CreditCardPayment + item.CarPayment + item.StudentLoanPayments) /
          item.GrossMonthlyIncome) *
        100;
      const FEDTI =
        (item.MonthlyMortgagePayment / item.GrossMonthlyIncome) * 100;

      if (item.CreditScore >= 640 && LTV < 80 && DTI <= 43 && FEDTI <= 28) {
        setApprovedCount((count) => count + 1);
      } else if (
        item.CreditScore >= 640 &&
        LTV >= 80 &&
        LTV <= 95 &&
        DTI <= 43 &&
        FEDTI <= 28
      ) {
        setPmiRequiredCount((count) => count + 1);
      } else {
        setRejectedCount((count) => count + 1);
      }
    });
  }, [jsonData]);

  const data = {
    labels: ["Approved", "PMI Required", "Rejected"],
    datasets: [
      {
        label: "Percentage Approved",
        data: [approvedCount, pmiRequiredCount, rejectedCount],
        backgroundColor: [
          "rgba(0, 255, 0, 0.2)",
          "rgba(255, 255, 0, 0.2)",
          "rgba(255, 0, 0, 0.2)",
        ],
        borderColor: [
          "rgba(0, 255, 0, 1)",
          "rgba(255, 255, 0, 1)",
          "rgba(255, 0, 0, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return <Pie data={data} />;
}
