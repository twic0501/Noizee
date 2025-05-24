// src/pages/Account/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Row, Col, Container } from 'react-bootstrap'; // Thêm Container
import { useQuery, useMutation, gql } from '@apollo/client';
import { GET_MY_PROFILE_QUERY } from '../../api/graphql/queries/userQueries';
// Giả sử bạn đã tạo UPDATE_MY_PROFILE_MUTATION trong userMutations.js
// import { UPDATE_MY_PROFILE_MUTATION } from '../../api/graphql/mutations/userMutations';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next'; // << IMPORT useTranslation

// Placeholder MUTATION - BẠN CẦN ĐỊNH NGHĨA MUTATION NÀY Ở BACKEND VÀ FRONTEND CHO ĐÚNG
const UPDATE_MY_PROFILE_MUTATION = gql`
  mutation UpdateMyProfile($input: UpdateProfileInput!) {
    updateMyProfile(input: $input) {
      customer_id
      customer_name
      username
      customer_tel
      customer_address
    }
  }
`;

function ProfilePage() {
    const { t, i18n } = useTranslation(); // << SỬ DỤNG HOOK
    const { loading: queryLoading, error: queryError, data: profileData, refetch } = useQuery(GET_MY_PROFILE_QUERY, {
        fetchPolicy: 'cache-and-network'
    });
    const { updateUserInfo } = useAuth();

    const [updateProfile, { loading: mutationLoading, error: mutationError }] = useMutation(UPDATE_MY_PROFILE_MUTATION, {
        onCompleted: (data) => {
            setFormMessage({ type: 'success', text: t('profilePage.updateSuccess') });
            setIsEditing(false);
            if (data.updateMyProfile) {
                updateUserInfo(data.updateMyProfile);
            }
            refetch();
        },
        onError: (err) => {
            setFormMessage({ type: 'danger', text: err.message || t('profilePage.updateErrorDefault') });
        }
    });

    const [formData, setFormData] = useState({
        customer_name: '',
        username: '',
        customer_email: '',
        customer_tel: '',
        customer_address: '',
    });
    const [isEditing, setIsEditing] = useState(false);
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (profileData?.myProfile) {
            setFormData({
                customer_name: profileData.myProfile.customer_name || '',
                username: profileData.myProfile.username || '',
                customer_email: profileData.myProfile.customer_email || '',
                customer_tel: profileData.myProfile.customer_tel || '',
                customer_address: profileData.myProfile.customer_address || '',
            });
        }
    }, [profileData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formMessage.text) setFormMessage({ type: '', text: ''});
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        if (isEditing && profileData?.myProfile) {
            setFormData({
                customer_name: profileData.myProfile.customer_name || '',
                username: profileData.myProfile.username || '',
                customer_email: profileData.myProfile.customer_email || '',
                customer_tel: profileData.myProfile.customer_tel || '',
                customer_address: profileData.myProfile.customer_address || '',
            });
        }
        setFormMessage({ type: '', text: ''});
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: ''});

        const { customer_name, username, customer_tel, customer_address } = formData;
         if (!customer_name.trim() || !customer_tel.trim()) {
            setFormMessage({ type: 'danger', text: t('profilePage.validation.namePhoneRequired') });
            return;
        }
        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(customer_tel.trim())) {
            setFormMessage({ type: 'danger', text: t('profilePage.validation.invalidPhone')});
            return;
        }
        if (username && (username.trim().length < 3 || /\s/.test(username.trim()))) {
            setFormMessage({ type: 'danger', text: t('profilePage.validation.invalidUsername')});
            return;
        }

        const inputForMutation = {
            customer_name: customer_name.trim(),
            username: username ? username.trim() : null,
            customer_tel: customer_tel.trim(),
            customer_address: customer_address ? customer_address.trim() : null,
        };
        updateProfile({ variables: { input: inputForMutation } });
    };

    if (queryLoading) return <Container className="my-4"><LoadingSpinner message={t('loadingSpinner.loading')} /></Container>;
    if (queryError) return <Container className="my-4"><AlertMessage variant="danger">{t('profilePage.loadError', { message: queryError.message })}</AlertMessage></Container>;
    if (!profileData?.myProfile) return <Container className="my-4"><AlertMessage variant="warning">{t('profilePage.noDataError')}</AlertMessage></Container>;

    const { virtual_balance } = profileData.myProfile;

    return (
        <Card className="shadow-sm card-page-content">
            <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 text-uppercase">{t('profilePage.title')}</h5>
                    <Button variant="outline-dark" size="sm" onClick={handleEditToggle} className="btn-edit-profile">
                        {isEditing ? <><i className="bi bi-x-lg me-1"></i> {t('profilePage.cancelButton')}</> : <><i className="bi bi-pencil-fill me-1"></i> {t('profilePage.editButton')}</>}
                    </Button>
                </div>
            </Card.Header>
            <Card.Body>
                {formMessage.text && <AlertMessage variant={formMessage.type} dismissible onClose={() => setFormMessage({type: '', text: ''}) }>{formMessage.text}</AlertMessage>}
                {mutationError && !formMessage.text && <AlertMessage variant="danger" >{t('profilePage.updateError', { message: mutationError.message })}</AlertMessage>}

                <div className="mb-4 p-3 bg-light-subtle rounded border border-primary-subtle profile-balance-box">
                    <h6 className="text-muted mb-1 small text-uppercase">{t('profilePage.virtualBalanceLabel')}</h6>
                    <p className="h4 mb-0 fw-bold text-primary">{formatCurrency(virtual_balance, i18n.language)}</p>
                </div>

                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="profileName">
                                <Form.Label>{t('profilePage.nameLabel')}</Form.Label>
                                <Form.Control type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} required disabled={!isEditing || mutationLoading} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="profileUsername">
                                <Form.Label>{t('profilePage.usernameLabel')}</Form.Label>
                                <Form.Control type="text" name="username" value={formData.username} onChange={handleChange} placeholder={t('profilePage.usernamePlaceholder')} disabled={!isEditing || mutationLoading} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3" controlId="profileEmail">
                        <Form.Label>{t('profilePage.emailLabel')}</Form.Label>
                        <Form.Control type="email" name="customer_email" value={formData.customer_email} readOnly disabled />
                        <Form.Text muted>{t('profilePage.emailCannotChange')}</Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="profilePhone">
                        <Form.Label>{t('profilePage.phoneLabel')}</Form.Label>
                        <Form.Control type="tel" name="customer_tel" value={formData.customer_tel} onChange={handleChange} required disabled={!isEditing || mutationLoading} />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="profileAddress">
                        <Form.Label>{t('profilePage.addressLabel')}</Form.Label>
                        <Form.Control as="textarea" rows={3} name="customer_address" value={formData.customer_address} onChange={handleChange} placeholder={t('profilePage.addressPlaceholder')} disabled={!isEditing || mutationLoading} />
                    </Form.Group>

                    {isEditing && (
                        <div className="mt-4">
                            <Button variant="dark" type="submit" disabled={mutationLoading} className="me-2">
                                {mutationLoading ? <><Spinner as="span" size="sm" className="me-1"/> {t('profilePage.savingButton')}</> : <><i className="bi bi-save me-1"></i> {t('profilePage.saveButton')}</>}
                            </Button>
                            <Button variant="outline-secondary" onClick={handleEditToggle} disabled={mutationLoading}>
                                {t('profilePage.cancelEditButton')}
                            </Button>
                        </div>
                    )}
                </Form>
            </Card.Body>
        </Card>
    );
}

export default ProfilePage;
