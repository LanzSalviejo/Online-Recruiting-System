import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const About = () => {

    return (
        <div className="about-container">
            <h2 className="about-title">About the Online Recruiting System</h2>
            <p className="about-description">
                The goal of the Online Recruiting System web application is to 
                provide users with a simple way to make their job search easier!
            </p>
            <h3 className="list-title">Our Features</h3>
            <ul className="feature-list">
                <li>Create your own profile and save your information</li>
                <li>Jobs listed by Category</li>
                <li>Quick Response times for application</li>
                <li>Simple click once and apply system</li>
                <li>Fast loading Website design</li>
            </ul>
            <br></br><br></br><br></br>
            <div className="about-actions">
             <Link to="/" className="about-button">
            <Home size={18} className="about-button-icon" />
            Get started on your job search!
            </Link>
            </div>
        </div>
    );
};

export default About;