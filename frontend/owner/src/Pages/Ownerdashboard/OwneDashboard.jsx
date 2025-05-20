//OwneDashboard

/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/react-in-jsx-scope */

import React from 'react';
import withAuth  from '../withAuth';

const OwneDashboard = ({ userId }) => {
  return (
    <div>
      <h2>User {userId} List , </h2>
      <ul>
          <li >
            owner-dashboard
          </li>
      </ul>
    </div>
  );
};

const AuthenticatedOwneDashboard = withAuth(OwneDashboard);
export default AuthenticatedOwneDashboard;
