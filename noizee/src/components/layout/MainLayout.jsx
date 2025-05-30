import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const MainLayout = ({ children }) => {
    const location = useLocation();
    const isHomepage = location.pathname === '/';

    // Xác định xem có cần thêm padding cho content không,
    // dựa trên việc Header có thể đang sticky và không transparent.
    // Logic này phụ thuộc vào chiều cao của Header và trạng thái sticky của nó.
    // Header tự quản lý việc nó có `bg-white shadow-md` hay không.
    // MainLayout chỉ cần đảm bảo nội dung không bị Header che khuất.

    // Một cách đơn giản là luôn có một khoảng đệm phía trên nếu không phải là homepage
    // hoặc nếu là homepage nhưng đã scroll qua hero section.
    // Tuy nhiên, Header đã là `fixed-top`, nên main content cần có padding-top
    // để không bị Header che. Chiều cao Header là `py-3` (1rem top + 1rem bottom) + line-height.
    // Giả sử chiều cao header khoảng 60px - 80px.

    // Lấy trạng thái sticky từ Header có thể phức tạp nếu không dùng context chung.
    // Thay vào đó, chúng ta có thể dựa vào `isHomepage` và có một class cố định cho padding.
    // Hoặc, để Header tự chiếm không gian và main bắt đầu từ dưới nó.
    // Cách đơn giản nhất là `page-content-wrapper` sẽ thêm padding.
    // Code mẫu của bạn đã có class `page-content-wrapper` với `padding-top: 88px`.

    // Lấy trạng thái isHeaderSticky từ một context hoặc state chung nếu cần điều chỉnh padding động hơn.
    // Hiện tại, chúng ta giả định Header luôn có chiều cao cố định khi sticky.
    // Và chỉ khi ở top của Homepage thì Header mới transparent và content mới tràn lên.

    let mainContentClass = "flex-grow-1"; // Default class for main content area

    // Nếu không phải là trang chủ, hoặc nếu là trang chủ nhưng đã scroll (Header có thể đã sticky)
    // thì chúng ta cần đảm bảo nội dung không bị Header che.
    // Header đã là fixed-top, nên cách tiếp cận tốt nhất là luôn có padding-top cho main content,
    // trừ khi bạn có hiệu ứng đặc biệt trên homepage mà Header chồng lên content.
    // Dựa trên logic Header, khi isHomepage và !isHeaderSticky, Header là transparent.
    // Các trang khác hoặc khi Header sticky, nó có background.

    // Chúng ta sẽ dùng một class để đẩy content xuống dưới Header.
    // Giá trị padding này nên bằng hoặc lớn hơn chiều cao của Header.
    // Bạn có thể định nghĩa nó trong `global.css` hoặc `index.css`.
    // Ví dụ: .main-content-pusher { padding-top: 80px; /* Điều chỉnh cho phù hợp chiều cao Header */ }

    if (location.pathname !== '/login' && location.pathname !== '/register') { // Không áp dụng cho trang auth toàn màn hình
        mainContentClass += " main-content-pusher"; // Thêm class này vào global.css
    }


    return (
        <div className="d-flex flex-column min-vh-100">
            { (location.pathname !== '/login' && location.pathname !== '/register') && <Header /> }
            <main className={mainContentClass}>
                {children}
            </main>
            { (location.pathname !== '/login' && location.pathname !== '/register') && <Footer /> }
        </div>
    );
};

export default MainLayout;