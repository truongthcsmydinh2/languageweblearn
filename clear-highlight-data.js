// Script để xóa sạch dữ liệu highlight cũ trong localStorage
// Chạy script này trong console của browser để xóa dữ liệu highlight cũ

console.log('Bắt đầu xóa dữ liệu highlight cũ...');

// Lấy tất cả keys trong localStorage
const keys = Object.keys(localStorage);

// Tìm và xóa các key liên quan đến IELTS reading
const ieltsKeys = keys.filter(key => key.startsWith('ielts_reading_state_'));
console.log('Tìm thấy các key IELTS reading:', ieltsKeys);

// Xóa từng key
ieltsKeys.forEach(key => {
  localStorage.removeItem(key);
  console.log(`Đã xóa: ${key}`);
});

// Kiểm tra còn key nào không
const remainingKeys = Object.keys(localStorage).filter(key => key.startsWith('ielts_reading_state_'));
console.log('Còn lại:', remainingKeys.length, 'key');

console.log('Hoàn thành xóa dữ liệu highlight cũ!');
console.log('Bây giờ bạn có thể test lại chức năng highlight.'); 