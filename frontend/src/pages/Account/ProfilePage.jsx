// src/pages/Account/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Row, Col } from 'react-bootstrap';
import { useQuery, useMutation, gql } from '@apollo/client'; // Thêm gql
import { GET_MY_PROFILE_QUERY } from '../../api/graphql/queries/userQueries';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth'; // Import useAuth

// TODO: Định nghĩa UPDATE_PROFILE_MUTATION ở backend và file mutations/userMutations.js
const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateMyProfile($input: UpdateProfileInput!) { # Tên Input Type này cần định nghĩa ở backend
    updateMyProfile(input: $input) {
      customer_id
      customer_name
      username
      customer_email # Thường không cho sửa email qua đây
      customer_tel
      customer_address
      # Không trả về virtual_balance hoặc isAdmin từ mutation này nếu không cần thiết
    }
  }
`;

function ProfilePage() {
    const { loading: queryLoading, error: queryError, data: profileData, refetch } = useQuery(GET_MY_PROFILE_QUERY, {
        fetchPolicy: 'cache-and-network'
    });
    const { updateUserInfo, userInfo } = useAuth(); // Lấy hàm updateUserInfo từ context

    const [updateProfile, { loading: mutationLoading, error: mutationError }] = useMutation(UPDATE_PROFILE_MUTATION, {
        onCompleted: (data) => {
            setFormMessage({ type: 'success', text: 'Thông tin cá nhân đã được cập nhật!' });
            setIsEditing(false);
            if (data.updateMyProfile) {
                updateUserInfo(data.updateMyProfile); // Cập nhật userInfo trong AuthContext
            }
            refetch(); // Fetch lại profile để đảm bảo dữ liệu mới nhất (bao gồm cả virtual_balance)
        },
        onError: (err) => {
            setFormMessage({ type: 'danger', text: err.message || 'Lỗi cập nhật thông tin.' });
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
        if (formMessage.text) setFormMessage({ type: '', text: ''}); // Clear message on change
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        if (isEditing && profileData?.myProfile) { // Nếu đang edit mà bấm Cancel, reset form
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
            setFormMessage({ type: 'danger', text: 'Họ tên và số điện thoại không được để trống.' });
            return;
        }
        // Basic phone regex (VN example, adjust as needed)
        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(customer_tel.trim())) {
            setFormMessage({ type: 'danger', text: "Định dạng số điện thoại không hợp lệ (VD: 0912345678)."});
            return;
        }
        if (username && (username.trim().length < 3 || /\s/.test(username.trim()))) {
            setFormMessage({ type: 'danger', text: "Username (nếu có) phải ít nhất 3 ký tự và không chứa khoảng trắng."});
            return;
        }

        const inputForMutation = {
            customer_name: customer_name.trim(),
            username: username ? username.trim() : null, // Gửi null nếu rỗng
            customer_tel: customer_tel.trim(),
            customer_address: customer_address ? customer_address.trim() : null, // Gửi null nếu rỗng
        };
        // Không gửi customer_email vì thường không cho sửa

        updateProfile({ variables: { input: inputForMutation } });
    };

    if (queryLoading) return <Container className="my-4"><LoadingSpinner message="Đang tải thông tin..." /></Container>;
    if (queryError) return <Container className="my-4"><AlertMessage variant="danger">Lỗi tải thông tin: {queryError.message}</AlertMessage></Container>;
    if (!profileData?.myProfile) return <Container className="my-4"><AlertMessage variant="warning">Không thể tải dữ liệu tài khoản.</AlertMessage></Container>;

    const { virtual_balance } = profileData.myProfile;

    return (
        <Card className="shadow-sm card-page-content">
            <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 text-uppercase">Thông tin tài khoản</h5>
                    <Button variant="outline-dark" size="sm" onClick={handleEditToggle} className="btn-edit-profile">
                        {isEditing ? <><i className="bi bi-x-lg me-1"></i> Hủy</> : <><i className="bi bi-pencil-fill me-1"></i> Chỉnh sửa</>}
                    </Button>
                </div>
            </Card.Header>
            <Card.Body>
                {formMessage.text && <AlertMessage variant={formMessage.type} dismissible onClose={() => setFormMessage({type: '', text: ''}) }>{formMessage.text}</AlertMessage>}
                {mutationError && !formMessage.text && <AlertMessage variant="danger" >Lỗi cập nhật: {mutationError.message}</AlertMessage>}


                <div className="mb-4 p-3 bg-light-subtle rounded border border-primary-subtle profile-balance-box">
                    <h6 className="text-muted mb-1 small text-uppercase">Số dư ảo của bạn</h6>
                    <p className="h4 mb-0 fw-bold text-primary">{formatCurrency(virtual_balance)}</p>
                    {/* <small className="text-muted d-block mt-1">Sử dụng để nhận ưu đãi khi mua hàng.</small> */}
                </div>

                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="profileName">
                                <Form.Label>Họ và tên</Form.Label>
                                <Form.Control type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} required disabled={!isEditing || mutationLoading} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="profileUsername">
                                <Form.Label>Username</Form.Label>
                                <Form.Control type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Tên hiển thị (tùy chọn)" disabled={!isEditing || mutationLoading} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3" controlId="profileEmail">
                        <Form.Label>Địa chỉ Email</Form.Label>
                        <Form.Control type="email" name="customer_email" value={formData.customer_email} readOnly disabled />
                        <Form.Text muted>Email không thể thay đổi.</Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="profilePhone">
                        <Form.Label>Số điện thoại</Form.Label>
                        <Form.Control type="tel" name="customer_tel" value={formData.customer_tel} onChange={handleChange} required disabled={!isEditing || mutationLoading} />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="profileAddress">
                        <Form.Label>Địa chỉ</Form.Label>
                        <Form.Control as="textarea" rows={3} name="customer_address" value={formData.customer_address} onChange={handleChange} placeholder="Địa chỉ nhận hàng (tùy chọn)" disabled={!isEditing || mutationLoading} />
                    </Form.Group>

                    {isEditing && (
                        <div className="mt-4">
                            <Button variant="dark" type="submit" disabled={mutationLoading} className="me-2">
                                {mutationLoading ? <><Spinner as="span" size="sm" className="me-1"/> Đang lưu...</> : <><i className="bi bi-save me-1"></i> Lưu thay đổi</>}
                            </Button>
                            <Button variant="outline-secondary" onClick={handleEditToggle} disabled={mutationLoading}>
                                Hủy bỏ
                            </Button>
                        </div>
                    )}
                </Form>
            </Card.Body>
        </Card>
    );
}

export default ProfilePage;