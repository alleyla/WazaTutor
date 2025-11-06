import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Account.css';

const Account = () => {
    const [userData, setUserData] = useState({
        name: '',
        email: '',
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAccountDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await fetch('/api/account', {
                    headers: {
                        'x-auth-token': token,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserData(data);
                } else {
                    toast.error('Failed to fetch account details.');
                    if (response.status === 401) {
                         // Clear token and navigate to login if unauthorized
                        localStorage.removeItem('token');
                        localStorage.removeItem('userId');
                        navigate('/login');
                    }
                }
            } catch (error) {
                console.error('Error fetching account details:', error);
                toast.error('An error occurred while fetching your account details.');
            }
        };

        fetchAccountDetails();
    }, [navigate]);

    const handleChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/account', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message);
                setUserData(data.user);
            } else {
                toast.error(data.message || 'Failed to update account.');
            }
        } catch (error) {
            console.error('Error updating account:', error);
            toast.error('An error occurred while updating your account.');
        }
    };

    return (
        <div className="account-container">
            <h2>My Account</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Name</label>
                    <input
                        type="text"
                        name="name"
                        value={userData.name}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={userData.email}
                        onChange={handleChange}
                    />
                </div>
                <button type="submit" className="btn-update">Update Account</button>
            </form>
        </div>
    );
};

export default Account;