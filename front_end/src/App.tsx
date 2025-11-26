import { useState } from 'react';
import api from '../configs/axios.config';

function App() {
  const [testResult, setTestResult] = useState('');

  const testApi = async () => {
    try {
      const response = await api.get('/test');
      setTestResult('API call successful: ' + JSON.stringify(response.data));
    } catch (error) {
      setTestResult('API call failed: ' + (error as Error).message);
    }
  };

  return (
    <>
      <h1>Hello world</h1>
      <button onClick={testApi}>Test API</button>
      <p>{testResult}</p>
    </>
  )
}

export default App
