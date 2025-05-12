const bcrypt = require('bcryptjs');

// --- Cấu hình ---
const plainPassword = 'Admin@2025!'; // Mật khẩu gốc bạn muốn đặt lại
const saltRounds = 10; // Số vòng băm (tiêu chuẩn là 10-12, càng cao càng an toàn nhưng càng tốn thời gian)

// --- Tạo salt và hash ---
try {
    // 1. Tạo salt
    // Sử dụng genSaltSync cho các script đơn giản, một lần.
    // Trong ứng dụng web, nên dùng phiên bản bất đồng bộ: bcrypt.genSalt(saltRounds, callback)
    const salt = bcrypt.genSaltSync(saltRounds);
    console.log(`Generated Salt: ${salt}`); // Tùy chọn: hiển thị salt

    // 2. Băm mật khẩu với salt
    // Tương tự, hashSync dùng cho script. Trong ứng dụng, dùng: bcrypt.hash(plainPassword, salt, callback)
    const hashedPassword = bcrypt.hashSync(plainPassword, salt);

    // --- Hiển thị kết quả ---
    console.log(`\nMật khẩu gốc: ${plainPassword}`);
    console.log(`Hash mới tương ứng (sao chép giá trị này):`);
    console.log(hashedPassword);

} catch (error) {
    console.error("Lỗi trong quá trình tạo hash:", error);
}

// --- Cách sử dụng khuyến nghị trong ứng dụng Node.js (phiên bản bất đồng bộ) ---
/*
async function hashPasswordAsync(password) {
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log(`\n(Async) Mật khẩu gốc: ${password}`);
        console.log('(Async) Hash mới tương ứng:');
        console.log(hashedPassword);
        return hashedPassword;
    } catch (error) {
        console.error("Lỗi khi băm mật khẩu (async):", error);
        throw error; // Ném lỗi để xử lý ở nơi gọi hàm
    }
}

// Để chạy phiên bản async:
// hashPasswordAsync(plainPassword).then(hash => {
//     // Làm gì đó với hash...
// }).catch(err => {
//     // Xử lý lỗi...
// });
*/