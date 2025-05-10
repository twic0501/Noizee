// src/pages/TheNoizeePage.jsx
import React from 'react';
import { Container, Row, Col, Image } from 'react-bootstrap';

function TheNoizeePage() {
  // Trang này có thiết kế linh hoạt theo yêu cầu
  return (
    <Container className="my-4 my-md-5">
      <Row className="align-items-center mb-5">
        <Col md={6}>
          <h1 className="display-3 page-title">The Noizee</h1> {/* CSS: Archivo Black? */}
          <p className="lead text-muted mb-4"> {/* CSS: Roboto Mono? */}
            This is where the story unfolds. Dive into the world of Noizee, our inspirations, and the culture we represent.
          </p>
           {/* CSS: Style button */}
          <button className="btn btn-outline-dark btn-lg">Explore More</button>
        </Col>
        <Col md={6} className="text-center">
            {/* Ảnh hoặc video đại diện */}
           <Image src="https://via.placeholder.com/500x500/000000/FFFFFF?text=Brand+Image/Video" fluid rounded />
        </Col>
      </Row>

      {/* Thêm các sections khác: Blog, Lookbook, Collaborations... */}
      <section className="my-5 py-5 bg-light text-center">
          <h2>Our Philosophy</h2>
          <p className="mt-3">Content about the brand's philosophy...</p>
      </section>
       <section className="my-5 py-5">
          <h2>Latest Blog Posts</h2>
           {/* TODO: Hiển thị bài viết blog */}
           <p className="text-muted">Blog section placeholder.</p>
      </section>

    </Container>
  );
}

export default TheNoizeePage;