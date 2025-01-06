import React, { useRef } from 'react';
import './App.css';
import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { CSSTransition } from 'react-transition-group';

function App() {
  const [name, setName] = useState('');
  const [submittedName, setSubmittedName] = useState('');

  const [gender, setGender] = useState<
    { gender: string; probability: number } | undefined
  >(undefined);
  const [nationality, setNationality] = useState<
    | { countryName: string; flag: string | undefined; probability: number }[]
    | undefined
  >(undefined);
  const [age, setAge] = useState<number | undefined>(undefined);
  const [resultName, setResultName] = useState<string | undefined>(undefined);

  const [loading, setLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);

  const notifyError = (message) => toast.error(message);

  const resultRef = useRef(null);

  const onSubmit = () => {
    if (name === '') {
      notifyError('Please enter a name.');
    } else {
      setSubmittedName(name);
    }
  };

  useEffect(() => {
    if (!submittedName) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const [genderRes, ageRes, nationalityRes] = await Promise.all([
          fetch(`http://localhost:3200/api/genderize/${submittedName}`),
          fetch(`http://localhost:3200/api/agify/${submittedName}`),
          fetch(`http://localhost:3200/api/nationalize/${submittedName}`),
        ]);

        const [genderData, ageData, nationalityData] = await Promise.all([
          genderRes.json(),
          ageRes.json(),
          nationalityRes.json(),
        ]);

        const countries = nationalityData.country || [];
        const countryPromises = countries.map(async (item) => {
          const country_id = item.country_id;
          const probability = item.probability;

          try {
            const response = await fetch(
              `https://restcountries.com/v3.1/alpha/${country_id}`
            );
            const [countryInfo] = await response.json();
            return {
              countryName: countryInfo?.name?.common,
              flag: countryInfo?.flag,
              probability,
            };
          } catch (err) {
            return {
              countryName: country_id,
              flag: undefined,
              probability,
            };
          }
        });
        const resolvedCountries = await Promise.all(countryPromises);

        setGender({
          gender: genderData?.gender,
          probability: genderData?.probability,
        });
        setAge(ageData?.age);
        setNationality(resolvedCountries);
        setResultName(submittedName);

        setDataFetched(true);
        setLoading(false);
      } catch (error) {
        notifyError('Error fetching data');
        setLoading(false);
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [submittedName]);

  useEffect(() => {
    if (gender && nationality && age && !loading) {
      setDataFetched(true);
    }
  }, [gender, nationality, age, loading]);

  return (
    <div className="App">
      <div className="App-header">
        <ToastContainer
          position="top-center"
          autoClose={3000}
          theme="colored"
          className={'toast-container'}
        />
        <InputPage setName={setName} onSubmit={onSubmit} loading={loading} />
        <CSSTransition
          in={dataFetched}
          classNames="fade"
          unmountOnExit
          nodeRef={resultRef}
        >
          <div ref={resultRef}>
            <ResultPage
              name={resultName}
              gender={gender}
              nationality={nationality}
              age={age}
            />
          </div>
        </CSSTransition>
      </div>
    </div>
  );
}

const InputPage = ({ setName, onSubmit, loading }) => {
  return (
    <div className="Card">
      <div className="App-heading">Name Insight</div>
      <input
        className="Input-bar"
        type="text"
        placeholder="Enter your name"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSubmit();
          }
        }}
      />
      <button
        className={`Submit-button ${loading ? 'loading' : ''}`}
        onClick={onSubmit}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Submit'}
      </button>
    </div>
  );
};

const ResultPage = ({ name, gender, nationality, age }) => {
  return (
    <div className="Card">
      <div className="Card-Row">
        <div className="Card-Label">Name:</div>
        <div className="Card-Value">{name}</div>
      </div>

      <div className="Card-Row">
        <div className="Card-Label">Gender:</div>
        <div className="Card-Value">
          {gender.gender
            ? gender.gender.charAt(0).toUpperCase() +
              gender.gender.slice(1).toLowerCase()
            : ''}
          , {(gender.probability * 100).toFixed(2)}% certainty
        </div>
      </div>

      <div className="Card-Row">
        <div className="Card-Label">Age:</div>
        <div className="Card-Value">{age}</div>
      </div>

      <div className="Card-Row">
        <div
          className="Card-Value"
          style={{
            padding: '10px',
            width: '100%',
            backgroundColor: '#cacaca68',
            borderRadius: '5px',
          }}
        >
          <table className="nationality-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', fontWeight: 'bold' }}>
                  Nationality
                </th>
                <th style={{ textAlign: 'right' }}>Probability</th>
              </tr>
            </thead>
            <tbody>
              {nationality.map((national, index) => (
                <tr key={index}>
                  <td style={{ textAlign: 'left' }}>
                    {national.countryName} {national.flag}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {(national.probability * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default App;
