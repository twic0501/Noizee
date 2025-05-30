import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
    return (
        <div className="container text-center py-5">
            <h1 className="display-1">404</h1>
            <h2>Page Not Found</h2>
            <p>Sorry, the page you are looking for does not exist.</p>
            <Link to="/" className="btn btn-dark">Go to Homepage</Link>
        </div>
    );
};
export default NotFoundPage;