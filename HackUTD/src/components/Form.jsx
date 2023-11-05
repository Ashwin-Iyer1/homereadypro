/* eslint-disable no-unused-vars */
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Slider from "./Slider";
import checkHomeApproval from "./CheckHomeApproval";
import BarChart from "./BarChart.png";
function Form({ formData, setFormData }) {

  const navigate = useNavigate();

  const [inputErrors, setInputErrors] = useState({
    grossMonthlyIncome: "",
    creditCardPayment: "",
    // Add other input fields here
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validateInput(name, value);
  };

  const handleSliderChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    validateInput(name, value);
  };

  const validateInput = (name, value) => {
    const minMaxValues = {
      grossMonthlyIncome: { min: 0, max: 10000 },
      creditCardPayment: { min: 0, max: 850 },
      // Add min and max values for other input fields here
    };

    if (value < minMaxValues[name].min || value > minMaxValues[name].max) {
      setInputErrors({
        ...inputErrors,
        [name]: `Value must be between ${minMaxValues[name].min} and ${minMaxValues[name].max}`,
      });
    } else {
      setInputErrors({ ...inputErrors, [name]: "" });
    }
  };

  const hasErrors = Object.values(inputErrors).some((error) => error !== "");

  const scrollToFirstError = () => {
    const firstErrorInput = document.querySelector(
      ".input-error" // Define a class for inputs with errors
    );

    if (firstErrorInput) {
      firstErrorInput.scrollIntoView({ behavior: "smooth" });
    }
  };
const [data, setData] = useState([
  { name: "CS", full_name: "Credit Score", Value: "", DesireRange: ">640", color: "" },
  { name: "LTV", full_name: "Loan-To-Value Ratio", Value: "", DesireRange: "<80%", color: "" },
  { name: "DTI", full_name: "Debt To Income Ratio", Value: "", DesireRange: "<43%", color: "" },
  { name: "FEDTI", full_name: "Front-End-Debt To Income Ratio", Value: "", DesireRange: "<=28%", color: "" },
]);
  const handleCompareClick = (e) => {
    e.preventDefault();
    navigate("/submission");
  }       

  // Handle form submission
  const fetchData = async () => {
    const apiKey = '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';
    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a mortgage analyst'
            },
            {
              role: 'user',
              content: `I am currently not approved for a loan, what can I do to get approved? Here are my statistics and please give me real life options to take for me to fix such issues. Answer in 2-3 sentences and give me really unique solutions and include my scores in your response so I know what they are - Credit Score: ${formData.creditScore}, Loan-To-Value Ratio: ${(((formData.appraisedValue - formData.downPayment)/formData.appraisedValue) * 100).toFixed(2)}, Debt To Income Ratio: ${(((formData.carPayment + formData.creditCardPayment + formData.monthlyMortgagePayment + formData.studentLoanPayments) / formData.grossMonthlyIncome) * 10).toFixed(2)}, Front-End-Debt To Income Ratio: ${((formData.monthlyMortgagePayment / formData.grossMonthlyIncome) * 100).toFixed(2)}`
            }
          ]
        })
      });

      const data = await response.json();
      console.log(data);
      const message = data.choices[0].message.content;
      document.querySelector('.GPTResponse').innerText += message;
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };



  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (hasErrors) {
      // Scroll to the form element when there are errors
      scrollToFirstError();
    } else {
      fetchData();
    setData(prevData => [
      {
        ...prevData[0],
        Value: formData.creditScore,
        color: formData.creditScore > 640 ? "green" : "red",
      },
      {
        ...prevData[1],
        Value: (((formData.appraisedValue - formData.downPayment)/formData.appraisedValue) * 100).toFixed(2),
        color: ((formData.appraisedValue - formData.downPayment)/formData.appraisedValue) < .8 ? "green" : "red", // You can set color based on your logic here
      },
      {
        ...prevData[2],
        Value: (((formData.carPayment + formData.creditCardPayment + formData.monthlyMortgagePayment + formData.studentLoanPayments) / formData.grossMonthlyIncome) * 10).toFixed(2),
        color: ((formData.carPayment + formData.creditCardPayment + formData.monthlyMortgagePayment + formData.studentLoanPayments) / formData.grossMonthlyIncome) <= 4.3  ? "green" : "red", // You can set color based on your logic here
      },
      {
        ...prevData[3],
        Value: ((formData.monthlyMortgagePayment / formData.grossMonthlyIncome) * 100).toFixed(2),
        color: formData.monthlyMortgagePayment / formData.grossMonthlyIncome <= .28 ? "green" : "red", // You can set color based on your logic here
      },
    ]);      
      const approvalStatus = checkHomeApproval(formData);

      if (approvalStatus == 'Y') {
        document.querySelector('.approval').innerText = 'You are approved';
        document.querySelector('.approval').style.color = "green";
      }
      else{
        document.querySelector('.approval').innerText = 'You are not approved';
        document.querySelector('.approval').style.color = "red";
      }
      console.log("Approval Status:", approvalStatus);

            // navigate("/submission");
      // You can process the form data here
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-100 bg-opacity-10 p-6 rounded-md shadow-md">
      <h1 className="text-1xl italic text-white mb-4">
        Complete the following fields to receive your homeownership eligibility
        status.
      </h1>

      <form onSubmit={handleSubmit} className="text-white">
        <div className="mb-4">
          <label htmlFor="email" className="block font-semibold">
            Email Address
          </label>
          <input
            type="text"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="bg-gray-900 border p-2 w-full rounded-md text-white mb-10"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="grossMonthlyIncome" className="block font-semibold">
            Gross Monthly Income
          </label>
          <input
            type="number"
            name="grossMonthlyIncome"
            value={formData.grossMonthlyIncome}
            onChange={handleInputChange}
            className={`bg-gray-900 border p-2 w-full rounded-md text-white ${
              inputErrors.grossMonthlyIncome ? "input-error" : ""
            }`}
          />
          {inputErrors.grossMonthlyIncome && (
            <p className="text-red-500">{inputErrors.grossMonthlyIncome}</p>
          )}
          <Slider
            min={0}
            max={10000}
            step={100}
            value={formData.grossMonthlyIncome}
            onValueChange={(value) =>
              handleSliderChange("grossMonthlyIncome", value)
            }
          />
        </div>

        <div className="mb-4">
          <label htmlFor="creditCardPayment" className="block font-semibold">
            Credit Card Payment
          </label>
          <input
            type="number"
            name="creditCardPayment"
            value={formData.creditCardPayment}
            onChange={handleInputChange}
            className="bg-gray-900 border p-2 w-full rounded-md text-white"
          />
          <Slider
            min={0}
            max={850}
            step={10}
            value={formData.creditCardPayment}
            onValueChange={(value) =>
              handleSliderChange("creditCardPayment", value)
            }
          />
        </div>

        <div className="mb-4">
          <label htmlFor="downPayment" className="block font-semibold">
            Car Payment
          </label>
          <input
            type="number"
            name="carPayment"
            value={formData.carPayment}
            onChange={handleInputChange}
            className="bg-gray-900 border p-2 w-full rounded-md text-white"
          />
          <Slider
            min={0}
            max={1000}
            step={10}
            value={formData.carPayment}
            onValueChange={(value) => handleSliderChange("carPayment", value)}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="studentLoanPayments" className="block font-semibold">
            Student Loan Payment
          </label>
          <input
            type="number"
            name="studentLoanPayments"
            value={formData.studentLoanPayments}
            onChange={handleInputChange}
            className="bg-gray-900 border p-2 w-full rounded-md text-white"
          />
          <Slider
            min={0}
            max={20000}
            step={10}
            value={formData.studentLoanPayments}
            onValueChange={(value) =>
              handleSliderChange("studentLoanPayments", value)
            }
          />
        </div>

        <div className="mb-4">
          <label htmlFor="appraisedValue" className="block font-semibold">
            Appraised Value
          </label>
          <input
            type="number"
            name="appraisedValue"
            value={formData.appraisedValue}
            onChange={handleInputChange}
            className="bg-gray-900 border p-2 w-full rounded-md text-white"
          />
          <Slider
            min={0}
            max={1000000}
            step={10}
            value={formData.appraisedValue}
            onValueChange={(value) =>
              handleSliderChange("appraisedValue", value)
            }
          />
        </div>

        <div className="mb-4">
          <label htmlFor="downPayment" className="block font-semibold">
            Down Payment
          </label>
          <input
            type="number"
            name="downPayment"
            value={formData.downPayment}
            onChange={handleInputChange}
            className="bg-gray-900 border p-2 w-full rounded-md text-white"
          />
          <Slider
            min={0}
            max={100000}
            step={10}
            value={formData.downPayment}
            onValueChange={(value) => handleSliderChange("downPayment", value)}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="loanAmount" className="block font-semibold">
            Loan Amount
          </label>
          <input
            type="number"
            name="loanAmount"
            value={formData.loanAmount}
            onChange={handleInputChange}
            className="bg-gray-900 border p-2 w-full rounded-md text-white"
          />
          <Slider
            min={0}
            max={20000}
            step={10}
            value={formData.loanAmount}
            onValueChange={(value) => handleSliderChange("loanAmount", value)}
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="monthlyMortgagePayment"
            className="block font-semibold"
          >
            Monthly Mortgage Payment
          </label>
          <input
            type="number"
            name="monthlyMortgagePayment"
            value={formData.monthlyMortgagePayment}
            onChange={handleInputChange}
            className="bg-gray-900 border p-2 w-full rounded-md text-white"
          />
          <Slider
            min={0}
            max={20000}
            step={10}
            value={formData.monthlyMortgagePayment}
            onValueChange={(value) =>
              handleSliderChange("monthlyMortgagePayment", value)
            }
          />
        </div>

        <div className="mb-4">
          <label htmlFor="creditScore" className="block font-semibold">
            Credit Score
          </label>
          <input
            type="number"
            name="creditScore"
            value={formData.creditScore}
            onChange={handleInputChange}
            className="bg-gray-900 border p-2 w-full rounded-md text-white"
          />
          <Slider
            min={0}
            max={850}
            step={5}
            value={formData.creditScore}
            onValueChange={(value) => handleSliderChange("creditScore", value)}
          />
        </div>

        <button
          type="submit"
          className="relative bg-transparent text-white border border-white py-2 px-4 rounded-md hover:bg-gray-400 hover:border-gray-400 transition-colors duration-300 transform hover:scale-105 mt-2"  // Reduce the top margin to mt-2
          >
            Submit
        </button>

      </form>
      <button
  type="Compare"
  onClick={handleCompareClick}
  className="fixed right-20 top-1/2 transform -translate-y-1/2 bg-cyan-500 hover:bg-cyan-600 rounded-full w-40 h-40 text-white flex flex-col items-center justify-center transition-transform duration-300"
>
  <img src={BarChart} alt="Bar Chart" className="w=60 h-30 mb-1" />
  <div className="text-center text-xl">Charts</div>
</button>

      <br/>
      <h1 className="approval"></h1>
      <p className="GPTResponse text-white"></p>
      <br/>
      <table className="w-full bg-opacity-10 bg-white border-white border rounded-md p-4 mx-auto text-white">
  <thead>
    <tr>
      <th className="text-white">Name</th>
      <th className="text-white">Full Name</th>
      <th className="text-white">Value</th>
      <th className="text-white">Desired Range</th>
    </tr>
  </thead>
  <tbody>
    {data.map((val, key) => (
      <tr key={key}>
        <td className="text-center text-white">{val.name}</td>
        <td className="text-center text-white">{val.full_name}</td>
        <td className="text-center" style={{color: val.color}}>{val.Value}</td>
        <td className="text-center text-white">{val.DesireRange}</td>
      </tr>
    ))}
  </tbody>
</table>
<script>
</script>
    </div>
    
  );
}

export default Form;
