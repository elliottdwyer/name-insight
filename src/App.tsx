import React from 'react';
import './App.css';
import { useState, useEffect } from 'react';

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

  const [dataFetched, setDataFetched] = useState(false);

  const onSubmit = () => {
    if (name === '') {
      alert('Please enter a name');
    } else {
      setSubmittedName(name);
    }
  };

  useEffect(() => {
    // If there's no submittedName, no need to run the API calls.
    if (!submittedName) return;

    // We wrap our data fetching logic in an async function
    const fetchData = async () => {
      try {
        await fetch(`http://localhost:3200/api/genderize/${submittedName}`)
          .then((response) => response.json())
          .then((data) => {
            setGender({ gender: data.gender, probability: data.probability });
          });

        await fetch(`http://localhost:3200/api/agify/${submittedName}`)
          .then((response) => response.json())
          .then((data) => {
            setAge(data.age);
          });

        await fetch(`http://localhost:3200/api/nationalize/${submittedName}`)
          .then((response) => response.json())
          .then(async (data) => {
            const countries = data.country || [];

            const countryPromises = countries.map(async (item) => {
              const country_id = item.country_id;
              const probability = item.probability;

              try {
                const response = await fetch(
                  `https://restcountries.com/v3.1/alpha/${country_id}`
                );
                const [countryInfo] = await response.json();
                return {
                  countryName: countryInfo.name.common,
                  flag: countryInfo.flag,
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

            return resolvedCountries;
          })
          .then((countries) => {
            setNationality(countries);
          });

        setDataFetched(true);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [submittedName]);

  useEffect(() => {
    if (gender && nationality && age) {
      setDataFetched(true);
    }
  }, [gender, nationality, age]);

  return (
    <div className="App">
      <div className="App-header">
        <InputPage setName={setName} onSubmit={onSubmit} />
        {dataFetched && (
          <ResultPage
            submittedName={submittedName}
            gender={gender}
            nationality={nationality}
            age={age}
          />
        )}
      </div>
    </div>
  );
}

const InputPage = ({ setName, onSubmit }) => {
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
      <button className="Submit-button" onClick={onSubmit}>
        Submit
      </button>
    </div>
  );
};

const ResultPage = ({ submittedName, gender, nationality, age }) => {
  return (
    <div className="Card">
      <div className="Card-Row">
        <div className="Card-Label">Name:</div>
        <div className="Card-Value">{submittedName}</div>
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
