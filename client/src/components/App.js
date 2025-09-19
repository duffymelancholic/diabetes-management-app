import React from "react";
import { BrowserRouter as Router, Switch, Route, Redirect } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import NavBar from "./NavBar";
import Login from "./Login";
import Signup from "./Signup";
import Dashboard from "./Dashboard";
import Profile from "./Profile";
import Readings from "./Readings";
import Medications from "./Medications";

function PrivateRoute({ children, ...rest }) {
  const { isAuthed } = useAuth();
  return (
    <Route
      {...rest}
      render={({ location }) =>
        isAuthed ? (
          children
        ) : (
          <Redirect to={{ pathname: "/login", state: { from: location } }} />
        )
      }
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <NavBar />
        <main className="container">
          <Switch>
            <Route path="/login">
              <Login />
            </Route>
            <Route path="/signup">
              <Signup />
            </Route>
            <PrivateRoute path="/dashboard">
              <Dashboard />
            </PrivateRoute>
            <PrivateRoute path="/profile">
              <Profile />
            </PrivateRoute>
            <PrivateRoute path="/readings">
              <Readings />
            </PrivateRoute>
            <PrivateRoute path="/medications">
              <Medications />
            </PrivateRoute>
            <Route path="/">
              <Redirect to="/login" />
            </Route>
          </Switch>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;
