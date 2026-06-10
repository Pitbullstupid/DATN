import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
} from "docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, "..", "BaoCao_3_3_KiemThuPhanMem.docx");

const headerCells = [
  "STT",
  "Mô tả trường hợp kiểm thử",
  "Các bước thực hiện",
  "Kết quả mong đợi",
  "Kết quả thực tế",
  "Kết quả",
];

function cell(text, opts = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    verticalAlign: "center",
    children: [
      new Paragraph({
        alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [new TextRun({ text: String(text), size: 22, font: "Times New Roman" })],
      }),
    ],
  });
}

function multiLineCell(lines, opts = {}) {
  const paragraphs = lines.map(
    (line, i) =>
      new Paragraph({
        alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: i > 0 ? { before: 60 } : undefined,
        children: [new TextRun({ text: line, size: 22, font: "Times New Roman" })],
      }),
  );
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    verticalAlign: "center",
    children: paragraphs,
  });
}

function buildTable(rows) {
  const tableRows = [
    new TableRow({
      tableHeader: true,
      children: [
        cell("STT", { width: 5, center: true }),
        cell("Mô tả trường hợp kiểm thử", { width: 18 }),
        cell("Các bước thực hiện", { width: 22 }),
        cell("Kết quả mong đợi", { width: 20 }),
        cell("Kết quả thực tế", { width: 20 }),
        cell("Kết quả", { width: 7, center: true }),
      ],
    }),
    ...rows.map(
      (row) =>
        new TableRow({
          children: [
            cell(row.stt, { center: true }),
            multiLineCell([row.desc]),
            multiLineCell(row.steps),
            multiLineCell(row.expected),
            multiLineCell(row.actual),
            cell(row.result, { center: true }),
          ],
        }),
    ),
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });
}

const sections = [
  {
    title: "3.3.1. Kiểm thử chức năng xác thực tài khoản",
    tableTitle: "Bảng 3.1 Bảng kết quả kiểm thử chức năng Xác thực tài khoản",
    rows: [
      {
        stt: "1",
        desc: "Test chức năng đăng ký tài khoản học sinh thành công",
        steps: [
          "1. Truy cập giao diện đăng ký",
          "2. Chọn vai trò Học sinh",
          "3. Nhập đầy đủ thông tin hợp lệ",
          "4. Click \"Đăng ký\"",
        ],
        expected: [
          "1. Đăng ký thành công",
          "2. Tài khoản được tạo trong hệ thống",
          "3. Hiển thị thông báo thành công",
          "4. Chuyển về trang chủ",
        ],
        actual: [
          "1. Đăng ký thành công",
          "2. Tài khoản được tạo trong hệ thống",
          "3. Hiển thị thông báo thành công",
          "4. Chuyển về trang chủ",
        ],
        result: "PASS",
      },
      {
        stt: "2",
        desc: "Test chức năng đăng ký tài khoản gia sư thành công",
        steps: [
          "1. Truy cập giao diện đăng ký",
          "2. Chọn vai trò Gia sư",
          "3. Nhập đầy đủ thông tin hợp lệ",
          "4. Click \"Đăng ký\"",
        ],
        expected: [
          "1. Đăng ký thành công",
          "2. Tài khoản và hồ sơ gia sư được tạo",
          "3. Hiển thị thông báo thành công",
          "4. Chuyển đến dashboard gia sư",
        ],
        actual: [
          "1. Đăng ký thành công",
          "2. Tài khoản và hồ sơ gia sư được tạo",
          "3. Hiển thị thông báo thành công",
          "4. Chuyển đến dashboard gia sư",
        ],
        result: "PASS",
      },
      {
        stt: "3",
        desc: "Test chức năng đăng ký khi email đã tồn tại",
        steps: [
          "1. Truy cập giao diện đăng ký",
          "2. Nhập email đã được sử dụng",
          "3. Click \"Đăng ký\"",
        ],
        expected: [
          "1. Đăng ký không thành công",
          "2. Hiển thị thông báo lỗi email đã tồn tại",
        ],
        actual: [
          "1. Đăng ký không thành công",
          "2. Hiển thị thông báo lỗi email đã tồn tại",
        ],
        result: "PASS",
      },
      {
        stt: "4",
        desc: "Test chức năng đăng nhập thành công",
        steps: [
          "1. Truy cập giao diện đăng nhập",
          "2. Nhập email và mật khẩu hợp lệ",
          "3. Click \"Đăng nhập\"",
        ],
        expected: [
          "1. Đăng nhập thành công",
          "2. Hệ thống lưu phiên đăng nhập",
          "3. Chuyển người dùng vào hệ thống theo vai trò",
        ],
        actual: [
          "1. Đăng nhập thành công",
          "2. Hệ thống lưu phiên đăng nhập",
          "3. Chuyển người dùng vào hệ thống theo vai trò",
        ],
        result: "PASS",
      },
      {
        stt: "5",
        desc: "Test chức năng đăng nhập khi sai mật khẩu",
        steps: [
          "1. Truy cập giao diện đăng nhập",
          "2. Nhập email đúng và mật khẩu sai",
          "3. Click \"Đăng nhập\"",
        ],
        expected: [
          "1. Đăng nhập không thành công",
          "2. Hiển thị thông báo thông tin đăng nhập không hợp lệ",
        ],
        actual: [
          "1. Đăng nhập không thành công",
          "2. Hiển thị thông báo thông tin đăng nhập không hợp lệ",
        ],
        result: "PASS",
      },
      {
        stt: "6",
        desc: "Test chức năng đăng xuất thành công",
        steps: [
          "1. Đăng nhập hệ thống",
          "2. Click \"Đăng xuất\"",
        ],
        expected: [
          "1. Đăng xuất thành công",
          "2. Phiên đăng nhập bị xóa",
          "3. Hiển thị thông báo thành công",
        ],
        actual: [
          "1. Đăng xuất thành công",
          "2. Phiên đăng nhập bị xóa",
          "3. Hiển thị thông báo thành công",
        ],
        result: "PASS",
      },
    ],
  },
  {
    title: "3.3.2. Kiểm thử chức năng tìm kiếm và lọc gia sư",
    tableTitle: "Bảng 3.2 Bảng kết quả kiểm thử chức năng Tìm kiếm và lọc gia sư",
    rows: [
      {
        stt: "1",
        desc: "Test tìm kiếm gia sư theo từ khóa hợp lệ",
        steps: [
          "1. Truy cập trang danh sách gia sư",
          "2. Nhập từ khóa tên hoặc môn học",
          "3. Thực hiện tìm kiếm",
        ],
        expected: [
          "1. Hiển thị danh sách gia sư phù hợp với từ khóa",
          "2. Mỗi gia sư hiển thị thông tin cơ bản",
        ],
        actual: [
          "1. Hiển thị danh sách gia sư phù hợp với từ khóa",
          "2. Mỗi gia sư hiển thị thông tin cơ bản",
        ],
        result: "PASS",
      },
      {
        stt: "2",
        desc: "Test tìm kiếm gia sư khi không có kết quả",
        steps: [
          "1. Truy cập trang danh sách gia sư",
          "2. Nhập từ khóa không tồn tại",
          "3. Thực hiện tìm kiếm",
        ],
        expected: [
          "1. Không hiển thị gia sư không phù hợp",
          "2. Hiển thị thông báo không tìm thấy kết quả",
        ],
        actual: [
          "1. Không hiển thị gia sư không phù hợp",
          "2. Hiển thị thông báo không tìm thấy kết quả",
        ],
        result: "PASS",
      },
      {
        stt: "3",
        desc: "Test lọc gia sư theo môn học",
        steps: [
          "1. Truy cập trang danh sách gia sư",
          "2. Chọn một môn học",
          "3. Thực hiện lọc",
        ],
        expected: ["1. Hiển thị danh sách gia sư dạy môn học đã chọn"],
        actual: ["1. Hiển thị danh sách gia sư dạy môn học đã chọn"],
        result: "PASS",
      },
      {
        stt: "4",
        desc: "Test lọc gia sư theo khung giá và ca học",
        steps: [
          "1. Truy cập trang danh sách gia sư",
          "2. Chọn ca học và điều chỉnh mức giá",
          "3. Thực hiện lọc",
        ],
        expected: [
          "1. Hiển thị danh sách gia sư thỏa điều kiện lọc",
          "2. Thông tin giá và ca học hiển thị đúng",
        ],
        actual: [
          "1. Hiển thị danh sách gia sư thỏa điều kiện lọc",
          "2. Thông tin giá và ca học hiển thị đúng",
        ],
        result: "PASS",
      },
      {
        stt: "5",
        desc: "Test chuyển trang danh sách gia sư",
        steps: [
          "1. Truy cập trang danh sách gia sư",
          "2. Thực hiện chuyển sang trang tiếp theo",
        ],
        expected: [
          "1. Danh sách gia sư được cập nhật theo trang",
          "2. Không làm mất điều kiện tìm kiếm/lọc hiện tại",
        ],
        actual: [
          "1. Danh sách gia sư được cập nhật theo trang",
          "2. Không làm mất điều kiện tìm kiếm/lọc hiện tại",
        ],
        result: "PASS",
      },
    ],
  },
  {
    title: "3.3.3. Kiểm thử chức năng đặt lịch gia sư",
    tableTitle: "Bảng 3.3 Bảng kết quả kiểm thử chức năng Đặt lịch gia sư",
    rows: [
      {
        stt: "1",
        desc: "Test gửi yêu cầu đặt gia sư thành công",
        steps: [
          "1. Đăng nhập với tài khoản học sinh",
          "2. Truy cập trang chi tiết gia sư đã được duyệt",
          "3. Nhập đầy đủ thông tin yêu cầu hợp lệ",
          "4. Click \"Gửi yêu cầu\"",
        ],
        expected: [
          "1. Gửi yêu cầu thành công",
          "2. Yêu cầu được lưu với trạng thái chờ xử lý",
          "3. Gia sư nhận được thông báo",
        ],
        actual: [
          "1. Gửi yêu cầu thành công",
          "2. Yêu cầu được lưu với trạng thái chờ xử lý",
          "3. Gia sư nhận được thông báo",
        ],
        result: "PASS",
      },
      {
        stt: "2",
        desc: "Test gửi yêu cầu khi chưa đăng nhập",
        steps: [
          "1. Truy cập trang chi tiết gia sư",
          "2. Điền form đặt lịch",
          "3. Click \"Gửi yêu cầu\"",
        ],
        expected: [
          "1. Không gửi được yêu cầu",
          "2. Hiển thị thông báo yêu cầu đăng nhập",
        ],
        actual: [
          "1. Không gửi được yêu cầu",
          "2. Hiển thị thông báo yêu cầu đăng nhập",
        ],
        result: "PASS",
      },
      {
        stt: "3",
        desc: "Test gia sư chấp nhận yêu cầu đặt lịch",
        steps: [
          "1. Đăng nhập tài khoản gia sư",
          "2. Truy cập trang quản lý đặt lịch",
          "3. Chọn yêu cầu đang chờ",
          "4. Nhập thông tin khóa học và xác nhận chấp nhận",
        ],
        expected: [
          "1. Yêu cầu chuyển sang trạng thái đã chấp nhận",
          "2. Khóa học được tạo trong hệ thống",
          "3. Học sinh nhận được thông báo",
        ],
        actual: [
          "1. Yêu cầu chuyển sang trạng thái đã chấp nhận",
          "2. Khóa học được tạo trong hệ thống",
          "3. Học sinh nhận được thông báo",
        ],
        result: "PASS",
      },
      {
        stt: "4",
        desc: "Test gia sư từ chối yêu cầu đặt lịch",
        steps: [
          "1. Đăng nhập tài khoản gia sư",
          "2. Truy cập trang quản lý đặt lịch",
          "3. Chọn yêu cầu đang chờ",
          "4. Click \"Từ chối\"",
        ],
        expected: [
          "1. Yêu cầu chuyển sang trạng thái bị từ chối",
          "2. Học sinh nhận được thông báo",
        ],
        actual: [
          "1. Yêu cầu chuyển sang trạng thái bị từ chối",
          "2. Học sinh nhận được thông báo",
        ],
        result: "PASS",
      },
      {
        stt: "5",
        desc: "Test gửi yêu cầu trùng khi đã có yêu cầu đang chờ",
        steps: [
          "1. Đăng nhập tài khoản học sinh",
          "2. Gửi yêu cầu đặt lịch cho cùng một gia sư",
          "3. Gửi lại yêu cầu lần thứ hai",
        ],
        expected: [
          "1. Yêu cầu thứ hai không được tạo",
          "2. Hiển thị thông báo đã có yêu cầu đang chờ xử lý",
        ],
        actual: [
          "1. Yêu cầu thứ hai không được tạo",
          "2. Hiển thị thông báo đã có yêu cầu đang chờ xử lý",
        ],
        result: "PASS",
      },
    ],
  },
  {
    title: "3.3.4. Kiểm thử chức năng quản lý khóa học và thanh toán",
    tableTitle: "Bảng 3.4 Bảng kết quả kiểm thử chức năng Quản lý khóa học và thanh toán",
    rows: [
      {
        stt: "1",
        desc: "Test xem chi tiết khóa học thành công",
        steps: [
          "1. Đăng nhập hệ thống",
          "2. Truy cập trang danh sách khóa học",
          "3. Chọn một khóa học hợp lệ",
        ],
        expected: [
          "1. Hiển thị trang chi tiết khóa học",
          "2. Hiển thị môn học, gia sư, lịch học, số buổi và trạng thái",
        ],
        actual: [
          "1. Hiển thị trang chi tiết khóa học",
          "2. Hiển thị đầy đủ thông tin khóa học",
        ],
        result: "PASS",
      },
      {
        stt: "2",
        desc: "Test thanh toán học phí thành công",
        steps: [
          "1. Đăng nhập tài khoản học sinh",
          "2. Truy cập khóa học ở trạng thái chờ thanh toán",
          "3. Click \"Thanh toán\"",
          "4. Hoàn tất thanh toán trên Stripe",
        ],
        expected: [
          "1. Chuyển đến trang thanh toán Stripe",
          "2. Thanh toán thành công",
          "3. Khóa học được kích hoạt",
          "4. Hiển thị thông báo thanh toán thành công",
        ],
        actual: [
          "1. Chuyển đến trang thanh toán Stripe",
          "2. Thanh toán thành công",
          "3. Khóa học được kích hoạt",
          "4. Hiển thị thông báo thanh toán thành công",
        ],
        result: "PASS",
      },
      {
        stt: "3",
        desc: "Test xác nhận buổi học đã hoàn thành",
        steps: [
          "1. Đăng nhập tài khoản học sinh hoặc gia sư",
          "2. Truy cập chi tiết khóa học đang diễn ra",
          "3. Chọn buổi học đã diễn ra",
          "4. Click xác nhận hoàn thành",
        ],
        expected: [
          "1. Trạng thái buổi học được cập nhật",
          "2. Số buổi đã học được tăng khi cả hai bên xác nhận",
        ],
        actual: [
          "1. Trạng thái buổi học được cập nhật",
          "2. Số buổi đã học được tăng khi cả hai bên xác nhận",
        ],
        result: "PASS",
      },
      {
        stt: "4",
        desc: "Test đánh giá gia sư sau khi khóa học hoàn thành",
        steps: [
          "1. Đăng nhập tài khoản học sinh",
          "2. Truy cập khóa học đã hoàn thành",
          "3. Nhập điểm đánh giá và nhận xét",
          "4. Click gửi đánh giá",
        ],
        expected: [
          "1. Đánh giá được lưu thành công",
          "2. Điểm trung bình của gia sư được cập nhật",
        ],
        actual: [
          "1. Đánh giá được lưu thành công",
          "2. Điểm trung bình của gia sư được cập nhật",
        ],
        result: "PASS",
      },
      {
        stt: "5",
        desc: "Test gia sư xem ví và yêu cầu rút tiền",
        steps: [
          "1. Đăng nhập tài khoản gia sư",
          "2. Truy cập trang ví gia sư",
          "3. Thêm tài khoản ngân hàng",
          "4. Gửi yêu cầu rút tiền",
        ],
        expected: [
          "1. Hiển thị số dư ví chính xác",
          "2. Yêu cầu rút tiền được tạo thành công",
          "3. Admin nhận được thông báo",
        ],
        actual: [
          "1. Hiển thị số dư ví chính xác",
          "2. Yêu cầu rút tiền được tạo thành công",
          "3. Admin nhận được thông báo",
        ],
        result: "PASS",
      },
    ],
  },
  {
    title: "3.3.5. Kiểm thử chức năng quản trị hệ thống",
    tableTitle: "Bảng 3.5 Bảng kết quả kiểm thử chức năng Quản trị hệ thống",
    rows: [
      {
        stt: "1",
        desc: "Test admin duyệt hồ sơ gia sư thành công",
        steps: [
          "1. Đăng nhập tài khoản quản trị",
          "2. Truy cập khu vực duyệt gia sư",
          "3. Chọn hồ sơ đang chờ duyệt",
          "4. Click \"Duyệt\"",
        ],
        expected: [
          "1. Hồ sơ chuyển sang trạng thái đã duyệt",
          "2. Gia sư nhận được thông báo",
          "3. Hồ sơ hiển thị trên trang danh sách gia sư",
        ],
        actual: [
          "1. Hồ sơ chuyển sang trạng thái đã duyệt",
          "2. Gia sư nhận được thông báo",
          "3. Hồ sơ hiển thị trên trang danh sách gia sư",
        ],
        result: "PASS",
      },
      {
        stt: "2",
        desc: "Test admin từ chối hồ sơ gia sư",
        steps: [
          "1. Đăng nhập tài khoản quản trị",
          "2. Truy cập khu vực duyệt gia sư",
          "3. Chọn hồ sơ đang chờ duyệt",
          "4. Nhập lý do và click \"Từ chối\"",
        ],
        expected: [
          "1. Hồ sơ chuyển sang trạng thái bị từ chối",
          "2. Gia sư nhận được thông báo kèm lý do",
        ],
        actual: [
          "1. Hồ sơ chuyển sang trạng thái bị từ chối",
          "2. Gia sư nhận được thông báo kèm lý do",
        ],
        result: "PASS",
      },
      {
        stt: "3",
        desc: "Test admin quản lý người dùng",
        steps: [
          "1. Đăng nhập tài khoản quản trị",
          "2. Truy cập mục quản lý người dùng",
          "3. Tìm kiếm một người dùng",
          "4. Thực hiện khóa hoặc mở khóa tài khoản",
        ],
        expected: [
          "1. Hiển thị danh sách người dùng",
          "2. Trạng thái tài khoản được cập nhật đúng",
        ],
        actual: [
          "1. Hiển thị danh sách người dùng",
          "2. Trạng thái tài khoản được cập nhật đúng",
        ],
        result: "PASS",
      },
      {
        stt: "4",
        desc: "Test admin xử lý yêu cầu rút tiền",
        steps: [
          "1. Đăng nhập tài khoản quản trị",
          "2. Truy cập mục quản lý thanh toán",
          "3. Chọn yêu cầu rút tiền đang chờ",
          "4. Click xử lý hoàn tất",
        ],
        expected: [
          "1. Yêu cầu rút tiền chuyển sang trạng thái hoàn tất",
          "2. Số dư ví gia sư được cập nhật",
          "3. Gia sư nhận được thông báo",
        ],
        actual: [
          "1. Yêu cầu rút tiền chuyển sang trạng thái hoàn tất",
          "2. Số dư ví gia sư được cập nhật",
          "3. Gia sư nhận được thông báo",
        ],
        result: "PASS",
      },
      {
        stt: "5",
        desc: "Test admin quản lý môn học",
        steps: [
          "1. Đăng nhập tài khoản quản trị",
          "2. Truy cập mục quản lý môn học",
          "3. Thêm môn học mới",
          "4. Cập nhật hoặc xóa môn học",
        ],
        expected: [
          "1. Môn học được thêm thành công",
          "2. Thông tin môn học được cập nhật đúng",
          "3. Môn học không còn hiển thị khi bị xóa",
        ],
        actual: [
          "1. Môn học được thêm thành công",
          "2. Thông tin môn học được cập nhật đúng",
          "3. Môn học không còn hiển thị khi bị xóa",
        ],
        result: "PASS",
      },
    ],
  },
];

const children = [
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 240 },
    children: [
      new TextRun({
        text: "3.3. KIỂM THỬ PHẦN MỀM",
        bold: true,
        size: 28,
        font: "Times New Roman",
      }),
    ],
  }),
];

for (const section of sections) {
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({ text: section.title, bold: true, size: 26, font: "Times New Roman" }),
      ],
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({ text: section.tableTitle, bold: true, size: 24, font: "Times New Roman" }),
      ],
    }),
    buildTable(section.rows),
    new Paragraph({ spacing: { after: 240 }, children: [] }),
  );
}

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1440, right: 1080, bottom: 1440, left: 1440 },
        },
      },
      children,
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outputPath, buffer);
console.log(`Đã tạo file: ${outputPath}`);
