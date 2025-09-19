import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

export default function Dashboard() {
  const { user, education, token } = useAuth();
  const [bmi, setBmi] = useState(null);
  const [bmiError, setBmiError] = useState(null);

  useEffect(() => {
    async function loadBMI() {
      if (!user) return;
      if (!user.height_cm || !user.weight_kg) return; // needs profile data
      try {
        const res = await fetch('/me/bmi', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setBmi(data);
        else setBmiError(data.error || 'Could not load BMI');
      } catch (e) {
        setBmiError(e.message);
      }
    }
    loadBMI();
  }, [user, token]);

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h2>Dashboard</h2>
      <section style={{ marginBottom: 16 }}>
        <div><strong>Name:</strong> {user.name}</div>
        <div><strong>Email:</strong> {user.email}</div>
        <div><strong>Diabetes Type:</strong> {user.diabetes_type || 'Not set'}</div>
      </section>

      <section style={{ marginBottom: 16 }}>
        <h3>BMI</h3>
        {!user.height_cm || !user.weight_kg ? (
          <p>Set your height and weight in the Profile page to see your BMI.</p>
        ) : bmi ? (
          <p><strong>{bmi.bmi}</strong> — {bmi.category}</p>
        ) : bmiError ? (
          <p style={{ color: 'crimson' }}>{bmiError}</p>
        ) : (
          <p>Loading BMI...</p>
        )}
      </section>

      <section>
        <h3>Educational Insights</h3>
        {education && education.length > 0 ? (
          <ul>
            {education.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        ) : (
          <p>No specific tips yet. Update your diabetes type in your profile to get tailored insights.</p>
        )}
      </section>
    </div>
  );
}
