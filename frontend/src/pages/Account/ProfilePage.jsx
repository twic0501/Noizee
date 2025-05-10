// src/pages/Account/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Row, Col } from 'react-bootstrap';
import { useQuery /*, useMutation */ } from '@apollo/client';
import { GET_MY_PROFILE_QUERY } from '../../api/graphql/queries/userQueries';
// import { UPDATE_PROFILE_MUTATION } from '../../api/graphql/mutations/userMutations'; // TODO: Tạo mutation này
import LoadingSpinner from '@noizee/ui-components';
import AlertMessage from '@noizee/ui-components';
import { formatCurrency } from '@noizee/shared-utils';

function ProfilePage() {
    const { loading, error, data } = useQuery(GET_MY_PROFILE_QUERY, { fetchPolicy: 'cache-and-network' });
    // const [updateProfile, { loading: updating, error: updateError }] = useMutation(UPDATE_PROFILE_MUTATION); // TODO

    const [formData, setFormData] = useState({
        customer_name: '',
        username: '',
        customer_email: '', // Email thường không cho sửa
        customer_tel: '',
        customer_address: '',
    });
    const [isEditing, setIsEditing] = useState(false); // State để bật/tắt chế độ sửa
    const [formMessage, setFormMessage] = useState({ type: '', text: '' }); // State cho thông báo (success/error)


    useEffect(() => {
        if (data?.myProfile) {
            setFormData({
                customer_name: data.myProfile.customer_name || '',
                username: data.myProfile.username || '',
                customer_email: data.myProfile.customer_email || '',
                customer_tel: data.myProfile.customer_tel || '',
                customer_address: data.myProfile.customer_address || '',
            });
        }
    }, [data]);

     const handleChange = (e) => {
         const { name, value } = e.target;
         setFormData(prev => ({ ...prev, [name]: value }));
         setFormMessage({ type: '', text: ''}); // Clear message on change
     };

     const handleEditToggle = () => setIsEditing(!isEditing);

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: ''});
        console.log("Submitting Profile:", formData);
         alert("Update profile functionality requires backend mutation.");
         // TODO: Gọi mutation updateProfile
        // updateProfile({ variables: { input: { ...formData } } })
        //  .then(() => {
        //      setFormMessage({ type: 'success', text: 'Profile updated successfully!' });
        //      setIsEditing(false);
        //  })
        //  .catch(err => {
        //      setFormMessage({ type: 'danger', text: err.message || 'Failed to update profile.' });
        //  });
    };

    if (loading) return <LoadingSpinner message="Loading profile..." />;
    if (error) return <AlertMessage variant="danger">Error loading profile: {error.message}</AlertMessage>;
    if (!data?.myProfile) return <AlertMessage variant="warning">Could not load profile data.</AlertMessage>;

    const { virtual_balance } = data.myProfile;

  return (
    <Card className="shadow-sm">
      <Card.Header>
         <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">My Profile</h5>
            <Button variant="outline-secondary" size="sm" onClick={handleEditToggle}>
                {isEditing ? 'Cancel' : <><i className="bi bi-pencil-square me-1"></i> Edit</>}
             </Button>
         </div>
      </Card.Header>
      <Card.Body>
         {/* Thông báo */}
          {formMessage.text && <AlertMessage variant={formMessage.type}>{formMessage.text}</AlertMessage>}

          {/* Hiển thị số dư ảo */}
          <div className="mb-3 p-3 bg-light rounded border">
             <h6 className="text-muted mb-1">Virtual Balance</h6>
             <p className="h4 mb-0 fw-bold">{formatCurrency(virtual_balance)}</p>
          </div>


        <Form onSubmit={handleSubmit}>
          {/* Các trường thông tin */}
           <Row>
              <Col md={6}>
                 <Form.Group className="mb-3" controlId="profileName">
                   <Form.Label>Full Name</Form.Label>
                   <Form.Control type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} required disabled={!isEditing /* || updating */} />
                 </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="profileUsername">
                   <Form.Label>Username</Form.Label>
                   <Form.Control type="text" name="username" value={formData.username} onChange={handleChange} disabled={!isEditing /* || updating */} />
                   <Form.Text muted>Optional. Used for display.</Form.Text>
                 </Form.Group>
               </Col>
            </Row>

            <Form.Group className="mb-3" controlId="profileEmail">
               <Form.Label>Email Address</Form.Label>
               <Form.Control type="email" name="customer_email" value={formData.customer_email} readOnly disabled />
               <Form.Text muted>Email cannot be changed.</Form.Text>
             </Form.Group>

            <Form.Group className="mb-3" controlId="profilePhone">
               <Form.Label>Phone Number</Form.Label>
               <Form.Control type="tel" name="customer_tel" value={formData.customer_tel} onChange={handleChange} required disabled={!isEditing /* || updating */} />
             </Form.Group>

            <Form.Group className="mb-3" controlId="profileAddress">
               <Form.Label>Address</Form.Label>
               <Form.Control as="textarea" rows={3} name="customer_address" value={formData.customer_address} onChange={handleChange} disabled={!isEditing /* || updating */} />
             </Form.Group>

          {/* Nút Save chỉ hiện khi đang edit */}
          {isEditing && (
            <Button variant="dark" type="submit" disabled={/* updating */ false}>
               {/* {updating ? <><Spinner size="sm"/> Saving...</> : 'Save Changes'} */}
               Save Changes (Requires API)
             </Button>
          )}
        </Form>
      </Card.Body>
    </Card>
  );
}

export default ProfilePage;