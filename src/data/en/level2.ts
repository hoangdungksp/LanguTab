import type { Word } from '../../types';

/**
 * Level 2 — Cambridge Movers-equivalent vocabulary.
 *
 * Target audience: trẻ em 8-10 tuổi, học sinh lớp 3-4, A1 CEFR.
 * Builds on Level 1 with ~400 NEW words (no duplicates from Level 1).
 *
 * Topic expansion vs Level 1:
 *   - Daily routines + activities (more verbs)
 *   - Hobbies + sports (specific names)
 *   - Jobs + community helpers
 *   - Transportation (variety)
 *   - More foods (meals, fruits, vegetables)
 *   - More body parts + health
 *   - Feelings + character traits
 *   - Time expressions (days of week, months)
 *   - Numbers 21-100
 *   - Comparatives + opposites
 *   - More prepositions + conjunctions
 *
 * User-facing label: "Cấp 2 — Sơ trung" (avoids Cambridge trademark).
 */
export const enLevel2: Word[] = [
  // ─── Days of the week ───────────────────────────────────────────────
  { id: 'en_281', lang: 'en', term: 'Monday', phonetic: '/ˈmʌndeɪ/', translation: 'Thứ Hai', level: 2, pos: 'danh từ', example: 'I go to school Monday.', exampleTranslation: 'Tôi đi học thứ Hai.', hint: '📅' },
  { id: 'en_282', lang: 'en', term: 'Tuesday', phonetic: '/ˈtuːzdeɪ/', translation: 'Thứ Ba', level: 2, pos: 'danh từ', example: 'Tuesday is busy.', exampleTranslation: 'Thứ Ba bận rộn.', hint: '📅' },
  { id: 'en_283', lang: 'en', term: 'Wednesday', phonetic: '/ˈwenzdeɪ/', translation: 'Thứ Tư', level: 2, pos: 'danh từ', example: 'I have art Wednesday.', exampleTranslation: 'Thứ Tư tôi học vẽ.', hint: '📅' },
  { id: 'en_284', lang: 'en', term: 'Thursday', phonetic: '/ˈθɜːrzdeɪ/', translation: 'Thứ Năm', level: 2, pos: 'danh từ', example: 'Thursday is fun.', exampleTranslation: 'Thứ Năm vui.', hint: '📅' },
  { id: 'en_285', lang: 'en', term: 'Friday', phonetic: '/ˈfraɪdeɪ/', translation: 'Thứ Sáu', level: 2, pos: 'danh từ', example: 'Friday is the best!', exampleTranslation: 'Thứ Sáu tuyệt nhất!', hint: '📅' },
  { id: 'en_286', lang: 'en', term: 'Saturday', phonetic: '/ˈsætərdeɪ/', translation: 'Thứ Bảy', level: 2, pos: 'danh từ', example: 'Saturday I play.', exampleTranslation: 'Thứ Bảy tôi chơi.', hint: '📅' },
  { id: 'en_287', lang: 'en', term: 'Sunday', phonetic: '/ˈsʌndeɪ/', translation: 'Chủ Nhật', level: 2, pos: 'danh từ', example: 'Sunday we rest.', exampleTranslation: 'Chủ Nhật chúng ta nghỉ.', hint: '📅' },
  { id: 'en_288', lang: 'en', term: 'week', phonetic: '/wiːk/', translation: 'tuần', level: 2, pos: 'danh từ', example: 'Have a good week.', exampleTranslation: 'Chúc tuần vui.', hint: '🗓️' },
  { id: 'en_289', lang: 'en', term: 'weekend', phonetic: '/ˈwiːkend/', translation: 'cuối tuần', level: 2, pos: 'danh từ', example: 'I love weekends.', exampleTranslation: 'Tôi yêu cuối tuần.', hint: '🎉' },

  // ─── Months ─────────────────────────────────────────────────────────
  { id: 'en_290', lang: 'en', term: 'January', phonetic: '/ˈdʒænjuˌeri/', translation: 'tháng Một', level: 2, pos: 'danh từ', example: 'January is cold.', exampleTranslation: 'Tháng Một lạnh.', hint: '❄️' },
  { id: 'en_291', lang: 'en', term: 'February', phonetic: '/ˈfebruˌeri/', translation: 'tháng Hai', level: 2, pos: 'danh từ', example: 'Tet is in February.', exampleTranslation: 'Tết vào tháng Hai.', hint: '🧧' },
  { id: 'en_292', lang: 'en', term: 'March', phonetic: '/mɑːrtʃ/', translation: 'tháng Ba', level: 2, pos: 'danh từ', example: 'March has flowers.', exampleTranslation: 'Tháng Ba có hoa.', hint: '🌸' },
  { id: 'en_293', lang: 'en', term: 'April', phonetic: '/ˈeɪprəl/', translation: 'tháng Tư', level: 2, pos: 'danh từ', example: 'April brings rain.', exampleTranslation: 'Tháng Tư có mưa.', hint: '🌧️' },
  { id: 'en_294', lang: 'en', term: 'May', phonetic: '/meɪ/', translation: 'tháng Năm', level: 2, pos: 'danh từ', example: 'My birthday is in May.', exampleTranslation: 'Sinh nhật tôi tháng Năm.', hint: '🎂' },
  { id: 'en_295', lang: 'en', term: 'June', phonetic: '/dʒuːn/', translation: 'tháng Sáu', level: 2, pos: 'danh từ', example: 'School ends in June.', exampleTranslation: 'Hết trường tháng Sáu.', hint: '☀️' },
  { id: 'en_296', lang: 'en', term: 'July', phonetic: '/dʒuˈlaɪ/', translation: 'tháng Bảy', level: 2, pos: 'danh từ', example: 'July is hot.', exampleTranslation: 'Tháng Bảy nóng.', hint: '🌞' },
  { id: 'en_297', lang: 'en', term: 'August', phonetic: '/ˈɔːɡəst/', translation: 'tháng Tám', level: 2, pos: 'danh từ', example: 'I swim in August.', exampleTranslation: 'Tôi bơi tháng Tám.', hint: '🏊' },
  { id: 'en_298', lang: 'en', term: 'September', phonetic: '/sepˈtembər/', translation: 'tháng Chín', level: 2, pos: 'danh từ', example: 'School starts in September.', exampleTranslation: 'Đi học lại tháng Chín.', hint: '🏫' },
  { id: 'en_299', lang: 'en', term: 'October', phonetic: '/ɒkˈtoʊbər/', translation: 'tháng Mười', level: 2, pos: 'danh từ', example: 'October is cool.', exampleTranslation: 'Tháng Mười mát.', hint: '🍂' },
  { id: 'en_300', lang: 'en', term: 'November', phonetic: '/noʊˈvembər/', translation: 'tháng Mười Một', level: 2, pos: 'danh từ', example: 'November has Teachers Day.', exampleTranslation: 'Tháng Mười Một có ngày nhà giáo.', hint: '👩‍🏫' },
  { id: 'en_301', lang: 'en', term: 'December', phonetic: '/dɪˈsembər/', translation: 'tháng Mười Hai', level: 2, pos: 'danh từ', example: 'Christmas is in December.', exampleTranslation: 'Giáng Sinh tháng 12.', hint: '🎄' },
  { id: 'en_302', lang: 'en', term: 'month', phonetic: '/mʌnθ/', translation: 'tháng', level: 2, pos: 'danh từ', example: 'A year has 12 months.', exampleTranslation: 'Một năm có 12 tháng.', hint: '📆' },
  { id: 'en_303', lang: 'en', term: 'yesterday', phonetic: '/ˈjestərdeɪ/', translation: 'hôm qua', level: 2, pos: 'trạng từ', example: 'Yesterday was Sunday.', exampleTranslation: 'Hôm qua Chủ Nhật.', hint: '⏪' },
  { id: 'en_304', lang: 'en', term: 'tomorrow', phonetic: '/təˈmɒroʊ/', translation: 'ngày mai', level: 2, pos: 'trạng từ', example: 'Tomorrow is a holiday.', exampleTranslation: 'Mai là ngày lễ.', hint: '⏩' },
  { id: 'en_305', lang: 'en', term: 'afternoon', phonetic: '/ˌæftərˈnuːn/', translation: 'buổi chiều', level: 2, pos: 'danh từ', example: 'Good afternoon, sir.', exampleTranslation: 'Chào buổi chiều.', hint: '🌇' },
  { id: 'en_306', lang: 'en', term: 'evening', phonetic: '/ˈiːvnɪŋ/', translation: 'buổi tối', level: 2, pos: 'danh từ', example: 'Good evening!', exampleTranslation: 'Chào buổi tối!', hint: '🌆' },
  { id: 'en_307', lang: 'en', term: 'hour', phonetic: '/ˈaʊər/', translation: 'giờ', level: 2, pos: 'danh từ', example: 'Wait one hour.', exampleTranslation: 'Đợi một giờ.', hint: '🕐' },
  { id: 'en_308', lang: 'en', term: 'minute', phonetic: '/ˈmɪnɪt/', translation: 'phút', level: 2, pos: 'danh từ', example: 'Just one minute.', exampleTranslation: 'Chờ một phút.', hint: '⏱️' },

  // ─── Numbers 21-100 ─────────────────────────────────────────────────
  { id: 'en_309', lang: 'en', term: 'thirty', phonetic: '/ˈθɜːrti/', translation: 'ba mươi', level: 2, pos: 'số đếm', example: 'I have thirty books.', exampleTranslation: 'Tôi có ba mươi quyển sách.', hint: '3️⃣0️⃣' },
  { id: 'en_310', lang: 'en', term: 'forty', phonetic: '/ˈfɔːrti/', translation: 'bốn mươi', level: 2, pos: 'số đếm', example: 'Forty kids in class.', exampleTranslation: 'Bốn mươi bạn trong lớp.', hint: '4️⃣0️⃣' },
  { id: 'en_311', lang: 'en', term: 'fifty', phonetic: '/ˈfɪfti/', translation: 'năm mươi', level: 2, pos: 'số đếm', example: 'Grandma is fifty.', exampleTranslation: 'Bà năm mươi tuổi.', hint: '5️⃣0️⃣' },
  { id: 'en_312', lang: 'en', term: 'sixty', phonetic: '/ˈsɪksti/', translation: 'sáu mươi', level: 2, pos: 'số đếm', example: 'Sixty minutes is one hour.', exampleTranslation: 'Sáu mươi phút là một giờ.', hint: '6️⃣0️⃣' },
  { id: 'en_313', lang: 'en', term: 'seventy', phonetic: '/ˈsevənti/', translation: 'bảy mươi', level: 2, pos: 'số đếm', example: 'Grandpa is seventy.', exampleTranslation: 'Ông bảy mươi tuổi.', hint: '7️⃣0️⃣' },
  { id: 'en_314', lang: 'en', term: 'eighty', phonetic: '/ˈeɪti/', translation: 'tám mươi', level: 2, pos: 'số đếm', example: 'I have eighty pages.', exampleTranslation: 'Tôi có tám mươi trang.', hint: '8️⃣0️⃣' },
  { id: 'en_315', lang: 'en', term: 'ninety', phonetic: '/ˈnaɪnti/', translation: 'chín mươi', level: 2, pos: 'số đếm', example: 'Ninety degrees outside.', exampleTranslation: 'Ngoài trời chín mươi độ.', hint: '9️⃣0️⃣' },
  { id: 'en_316', lang: 'en', term: 'hundred', phonetic: '/ˈhʌndrəd/', translation: 'một trăm', level: 2, pos: 'số đếm', example: 'A hundred kids cheer.', exampleTranslation: 'Một trăm bạn hò reo.', hint: '💯' },
  { id: 'en_317', lang: 'en', term: 'first', phonetic: '/fɜːrst/', translation: 'thứ nhất', level: 2, pos: 'số thứ tự', example: 'I am the first.', exampleTranslation: 'Tôi là người đầu tiên.', hint: '🥇' },
  { id: 'en_318', lang: 'en', term: 'second', phonetic: '/ˈsekənd/', translation: 'thứ hai', level: 2, pos: 'số thứ tự', example: 'She came second.', exampleTranslation: 'Cô ấy về nhì.', hint: '🥈' },
  { id: 'en_319', lang: 'en', term: 'third', phonetic: '/θɜːrd/', translation: 'thứ ba', level: 2, pos: 'số thứ tự', example: 'My third book.', exampleTranslation: 'Quyển sách thứ ba của tôi.', hint: '🥉' },
  { id: 'en_320', lang: 'en', term: 'last', phonetic: '/læst/', translation: 'cuối cùng', level: 2, pos: 'tính từ', example: 'I am the last one.', exampleTranslation: 'Tôi là người cuối.', hint: '🏁' },

  // ─── Daily routines (verbs) ─────────────────────────────────────────
  { id: 'en_321', lang: 'en', term: 'wake up', phonetic: '/weɪk ʌp/', translation: 'thức dậy', level: 2, pos: 'cụm động từ', example: 'I wake up at six.', exampleTranslation: 'Tôi thức dậy lúc sáu giờ.', hint: '⏰' },
  { id: 'en_322', lang: 'en', term: 'get up', phonetic: '/ɡet ʌp/', translation: 'dậy khỏi giường', level: 2, pos: 'cụm động từ', example: 'Get up, kids!', exampleTranslation: 'Dậy nào các con!', hint: '🛌' },
  { id: 'en_323', lang: 'en', term: 'wash', phonetic: '/wɒʃ/', translation: 'rửa', level: 2, pos: 'động từ', example: 'I wash my face.', exampleTranslation: 'Tôi rửa mặt.', hint: '🚿' },
  { id: 'en_324', lang: 'en', term: 'brush', phonetic: '/brʌʃ/', translation: 'đánh/chải', level: 2, pos: 'động từ', example: 'Brush your teeth.', exampleTranslation: 'Đánh răng đi.', hint: '🪥' },
  { id: 'en_325', lang: 'en', term: 'comb', phonetic: '/koʊm/', translation: 'chải tóc', level: 2, pos: 'động từ', example: 'I comb my hair.', exampleTranslation: 'Tôi chải tóc.', hint: '💇' },
  { id: 'en_326', lang: 'en', term: 'dress', phonetic: '/dres/', translation: 'mặc đồ', level: 2, pos: 'động từ', example: 'I dress quickly.', exampleTranslation: 'Tôi mặc đồ nhanh.', hint: '👔' },
  { id: 'en_327', lang: 'en', term: 'put on', phonetic: '/pʊt ɒn/', translation: 'mặc/đội', level: 2, pos: 'cụm động từ', example: 'Put on your shoes.', exampleTranslation: 'Mang giày vào.', hint: '👟' },
  { id: 'en_328', lang: 'en', term: 'take off', phonetic: '/teɪk ɒf/', translation: 'cởi ra', level: 2, pos: 'cụm động từ', example: 'Take off your hat.', exampleTranslation: 'Cởi mũ ra.', hint: '🎩' },
  { id: 'en_329', lang: 'en', term: 'work', phonetic: '/wɜːrk/', translation: 'làm việc', level: 2, pos: 'động từ', example: 'Dad works hard.', exampleTranslation: 'Bố làm việc chăm chỉ.', hint: '💼' },
  { id: 'en_330', lang: 'en', term: 'study', phonetic: '/ˈstʌdi/', translation: 'học', level: 2, pos: 'động từ', example: 'I study English.', exampleTranslation: 'Tôi học tiếng Anh.', hint: '📚' },
  { id: 'en_331', lang: 'en', term: 'learn', phonetic: '/lɜːrn/', translation: 'học hỏi', level: 2, pos: 'động từ', example: 'I learn new words.', exampleTranslation: 'Tôi học từ mới.', hint: '🎓' },
  { id: 'en_332', lang: 'en', term: 'teach', phonetic: '/tiːtʃ/', translation: 'dạy', level: 2, pos: 'động từ', example: 'Mom teaches me math.', exampleTranslation: 'Mẹ dạy tôi toán.', hint: '👩‍🏫' },
  { id: 'en_333', lang: 'en', term: 'practice', phonetic: '/ˈpræktɪs/', translation: 'luyện tập', level: 2, pos: 'động từ', example: 'Practice every day.', exampleTranslation: 'Tập mỗi ngày.', hint: '🏃' },
  { id: 'en_334', lang: 'en', term: 'finish', phonetic: '/ˈfɪnɪʃ/', translation: 'hoàn thành', level: 2, pos: 'động từ', example: 'I finish my work.', exampleTranslation: 'Tôi xong việc.', hint: '✅' },
  { id: 'en_335', lang: 'en', term: 'start', phonetic: '/stɑːrt/', translation: 'bắt đầu', level: 2, pos: 'động từ', example: 'Class starts now.', exampleTranslation: 'Lớp học bắt đầu.', hint: '🚦' },
  { id: 'en_336', lang: 'en', term: 'stop', phonetic: '/stɒp/', translation: 'dừng', level: 2, pos: 'động từ', example: 'Stop the car.', exampleTranslation: 'Dừng xe lại.', hint: '🛑' },

  // ─── Sports & activities ────────────────────────────────────────────
  { id: 'en_337', lang: 'en', term: 'football', phonetic: '/ˈfʊtbɔːl/', translation: 'bóng đá', level: 2, pos: 'danh từ', example: 'I play football.', exampleTranslation: 'Tôi chơi bóng đá.', hint: '⚽' },
  { id: 'en_338', lang: 'en', term: 'soccer', phonetic: '/ˈsɒkər/', translation: 'bóng đá (Mỹ)', level: 2, pos: 'danh từ', example: 'Soccer is fun.', exampleTranslation: 'Bóng đá vui.', hint: '⚽' },
  { id: 'en_339', lang: 'en', term: 'basketball', phonetic: '/ˈbɑːskɪtbɔːl/', translation: 'bóng rổ', level: 2, pos: 'danh từ', example: 'Basketball is fun.', exampleTranslation: 'Bóng rổ vui.', hint: '🏀' },
  { id: 'en_340', lang: 'en', term: 'tennis', phonetic: '/ˈtenɪs/', translation: 'quần vợt', level: 2, pos: 'danh từ', example: 'I play tennis Sunday.', exampleTranslation: 'Tôi chơi tennis Chủ Nhật.', hint: '🎾' },
  { id: 'en_341', lang: 'en', term: 'badminton', phonetic: '/ˈbædmɪntən/', translation: 'cầu lông', level: 2, pos: 'danh từ', example: 'Dad loves badminton.', exampleTranslation: 'Bố thích cầu lông.', hint: '🏸' },
  { id: 'en_342', lang: 'en', term: 'swimming', phonetic: '/ˈswɪmɪŋ/', translation: 'bơi lội', level: 2, pos: 'danh từ', example: 'Swimming is healthy.', exampleTranslation: 'Bơi tốt cho sức khỏe.', hint: '🏊' },
  { id: 'en_343', lang: 'en', term: 'running', phonetic: '/ˈrʌnɪŋ/', translation: 'chạy bộ', level: 2, pos: 'danh từ', example: 'Running is good.', exampleTranslation: 'Chạy bộ tốt.', hint: '🏃' },
  { id: 'en_344', lang: 'en', term: 'sport', phonetic: '/spɔːrt/', translation: 'thể thao', level: 2, pos: 'danh từ', example: 'I love sport.', exampleTranslation: 'Tôi yêu thể thao.', hint: '🏅' },
  { id: 'en_345', lang: 'en', term: 'team', phonetic: '/tiːm/', translation: 'đội', level: 2, pos: 'danh từ', example: 'My team is the best.', exampleTranslation: 'Đội tôi nhất.', hint: '👥' },
  { id: 'en_346', lang: 'en', term: 'win', phonetic: '/wɪn/', translation: 'thắng', level: 2, pos: 'động từ', example: 'We win the game.', exampleTranslation: 'Chúng tôi thắng.', hint: '🏆' },
  { id: 'en_347', lang: 'en', term: 'lose', phonetic: '/luːz/', translation: 'thua', level: 2, pos: 'động từ', example: 'Don\'t lose hope.', exampleTranslation: 'Đừng mất hy vọng.', hint: '😔' },
  { id: 'en_348', lang: 'en', term: 'catch', phonetic: '/kætʃ/', translation: 'bắt', level: 2, pos: 'động từ', example: 'Catch the ball!', exampleTranslation: 'Bắt bóng!', hint: '🤾' },
  { id: 'en_349', lang: 'en', term: 'throw', phonetic: '/θroʊ/', translation: 'ném', level: 2, pos: 'động từ', example: 'Throw the ball.', exampleTranslation: 'Ném bóng đi.', hint: '🥎' },
  { id: 'en_350', lang: 'en', term: 'kick', phonetic: '/kɪk/', translation: 'đá', level: 2, pos: 'động từ', example: 'Kick the ball hard.', exampleTranslation: 'Đá bóng mạnh.', hint: '🦵' },
  { id: 'en_351', lang: 'en', term: 'ride', phonetic: '/raɪd/', translation: 'đi (xe)', level: 2, pos: 'động từ', example: 'I ride a bike.', exampleTranslation: 'Tôi đạp xe.', hint: '🚴' },
  { id: 'en_352', lang: 'en', term: 'climb', phonetic: '/klaɪm/', translation: 'leo', level: 2, pos: 'động từ', example: 'Monkeys climb trees.', exampleTranslation: 'Khỉ leo cây.', hint: '🧗' },

  // ─── Jobs ──────────────────────────────────────────────────────────
  { id: 'en_353', lang: 'en', term: 'doctor', phonetic: '/ˈdɒktər/', translation: 'bác sĩ', level: 2, pos: 'danh từ', example: 'My mom is a doctor.', exampleTranslation: 'Mẹ tôi là bác sĩ.', hint: '👨‍⚕️' },
  { id: 'en_354', lang: 'en', term: 'nurse', phonetic: '/nɜːrs/', translation: 'y tá', level: 2, pos: 'danh từ', example: 'The nurse is kind.', exampleTranslation: 'Y tá tốt bụng.', hint: '👩‍⚕️' },
  { id: 'en_355', lang: 'en', term: 'farmer', phonetic: '/ˈfɑːrmər/', translation: 'nông dân', level: 2, pos: 'danh từ', example: 'The farmer grows rice.', exampleTranslation: 'Nông dân trồng lúa.', hint: '🧑‍🌾' },
  { id: 'en_356', lang: 'en', term: 'driver', phonetic: '/ˈdraɪvər/', translation: 'tài xế', level: 2, pos: 'danh từ', example: 'The bus driver smiles.', exampleTranslation: 'Tài xế bus mỉm cười.', hint: '🚌' },
  { id: 'en_357', lang: 'en', term: 'cook', phonetic: '/kʊk/', translation: 'đầu bếp', level: 2, pos: 'danh từ', example: 'The cook makes pizza.', exampleTranslation: 'Đầu bếp làm pizza.', hint: '👨‍🍳' },
  { id: 'en_358', lang: 'en', term: 'singer', phonetic: '/ˈsɪŋər/', translation: 'ca sĩ', level: 2, pos: 'danh từ', example: 'She is a singer.', exampleTranslation: 'Cô ấy là ca sĩ.', hint: '🎤' },
  { id: 'en_359', lang: 'en', term: 'artist', phonetic: '/ˈɑːrtɪst/', translation: 'nghệ sĩ', level: 2, pos: 'danh từ', example: 'The artist paints.', exampleTranslation: 'Nghệ sĩ vẽ tranh.', hint: '🎨' },
  { id: 'en_360', lang: 'en', term: 'police', phonetic: '/pəˈliːs/', translation: 'cảnh sát', level: 2, pos: 'danh từ', example: 'The police help people.', exampleTranslation: 'Cảnh sát giúp dân.', hint: '👮' },
  { id: 'en_361', lang: 'en', term: 'job', phonetic: '/dʒɒb/', translation: 'công việc', level: 2, pos: 'danh từ', example: 'Dad has a new job.', exampleTranslation: 'Bố có việc mới.', hint: '💼' },

  // ─── Transportation ─────────────────────────────────────────────────
  { id: 'en_362', lang: 'en', term: 'bus', phonetic: '/bʌs/', translation: 'xe buýt', level: 2, pos: 'danh từ', example: 'I take the bus.', exampleTranslation: 'Tôi đi xe buýt.', hint: '🚌' },
  { id: 'en_363', lang: 'en', term: 'train', phonetic: '/treɪn/', translation: 'xe lửa', level: 2, pos: 'danh từ', example: 'The train is fast.', exampleTranslation: 'Xe lửa nhanh.', hint: '🚂' },
  { id: 'en_364', lang: 'en', term: 'plane', phonetic: '/pleɪn/', translation: 'máy bay', level: 2, pos: 'danh từ', example: 'The plane flies high.', exampleTranslation: 'Máy bay bay cao.', hint: '✈️' },
  { id: 'en_365', lang: 'en', term: 'boat', phonetic: '/boʊt/', translation: 'thuyền', level: 2, pos: 'danh từ', example: 'A boat on the river.', exampleTranslation: 'Thuyền trên sông.', hint: '⛵' },
  { id: 'en_366', lang: 'en', term: 'ship', phonetic: '/ʃɪp/', translation: 'tàu thủy', level: 2, pos: 'danh từ', example: 'The ship is big.', exampleTranslation: 'Tàu thủy to.', hint: '🚢' },
  { id: 'en_367', lang: 'en', term: 'taxi', phonetic: '/ˈtæksi/', translation: 'taxi', level: 2, pos: 'danh từ', example: 'Call a taxi.', exampleTranslation: 'Gọi taxi đi.', hint: '🚕' },
  { id: 'en_368', lang: 'en', term: 'truck', phonetic: '/trʌk/', translation: 'xe tải', level: 2, pos: 'danh từ', example: 'The truck is huge.', exampleTranslation: 'Xe tải to.', hint: '🚚' },
  { id: 'en_369', lang: 'en', term: 'motorbike', phonetic: '/ˈmoʊtərbaɪk/', translation: 'xe máy', level: 2, pos: 'danh từ', example: 'Dad rides a motorbike.', exampleTranslation: 'Bố đi xe máy.', hint: '🏍️' },
  { id: 'en_370', lang: 'en', term: 'helicopter', phonetic: '/ˈhelɪkɒptər/', translation: 'trực thăng', level: 2, pos: 'danh từ', example: 'I see a helicopter.', exampleTranslation: 'Tôi thấy trực thăng.', hint: '🚁' },

  // ─── Food (vegetables, fruits, meals) ───────────────────────────────
  { id: 'en_371', lang: 'en', term: 'breakfast', phonetic: '/ˈbrekfəst/', translation: 'bữa sáng', level: 2, pos: 'danh từ', example: 'I eat breakfast at seven.', exampleTranslation: 'Tôi ăn sáng lúc bảy.', hint: '🥞' },
  { id: 'en_372', lang: 'en', term: 'lunch', phonetic: '/lʌntʃ/', translation: 'bữa trưa', level: 2, pos: 'danh từ', example: 'Lunch is at twelve.', exampleTranslation: 'Trưa lúc mười hai giờ.', hint: '🍱' },
  { id: 'en_373', lang: 'en', term: 'dinner', phonetic: '/ˈdɪnər/', translation: 'bữa tối', level: 2, pos: 'danh từ', example: 'Dinner is ready.', exampleTranslation: 'Bữa tối xong rồi.', hint: '🍽️' },
  { id: 'en_374', lang: 'en', term: 'snack', phonetic: '/snæk/', translation: 'đồ ăn vặt', level: 2, pos: 'danh từ', example: 'I want a snack.', exampleTranslation: 'Tôi muốn đồ ăn vặt.', hint: '🍪' },
  { id: 'en_375', lang: 'en', term: 'sandwich', phonetic: '/ˈsændwɪtʃ/', translation: 'bánh kẹp', level: 2, pos: 'danh từ', example: 'A ham sandwich.', exampleTranslation: 'Bánh kẹp giăm bông.', hint: '🥪' },
  { id: 'en_376', lang: 'en', term: 'noodles', phonetic: '/ˈnuːdəlz/', translation: 'mì', level: 2, pos: 'danh từ', example: 'I love noodles.', exampleTranslation: 'Tôi thích mì.', hint: '🍜' },
  { id: 'en_377', lang: 'en', term: 'soup', phonetic: '/suːp/', translation: 'súp', level: 2, pos: 'danh từ', example: 'Hot soup is good.', exampleTranslation: 'Súp nóng ngon.', hint: '🍲' },
  { id: 'en_378', lang: 'en', term: 'salad', phonetic: '/ˈsæləd/', translation: 'salad', level: 2, pos: 'danh từ', example: 'Salad is healthy.', exampleTranslation: 'Salad tốt cho sức khỏe.', hint: '🥗' },
  { id: 'en_379', lang: 'en', term: 'tomato', phonetic: '/təˈmeɪtoʊ/', translation: 'cà chua', level: 2, pos: 'danh từ', example: 'Red tomatoes are sweet.', exampleTranslation: 'Cà chua đỏ ngọt.', hint: '🍅' },
  { id: 'en_380', lang: 'en', term: 'potato', phonetic: '/pəˈteɪtoʊ/', translation: 'khoai tây', level: 2, pos: 'danh từ', example: 'I eat fried potato.', exampleTranslation: 'Tôi ăn khoai tây chiên.', hint: '🥔' },
  { id: 'en_381', lang: 'en', term: 'carrot', phonetic: '/ˈkærət/', translation: 'cà rốt', level: 2, pos: 'danh từ', example: 'Rabbits eat carrots.', exampleTranslation: 'Thỏ ăn cà rốt.', hint: '🥕' },
  { id: 'en_382', lang: 'en', term: 'onion', phonetic: '/ˈʌnjən/', translation: 'củ hành', level: 2, pos: 'danh từ', example: 'Onions make me cry.', exampleTranslation: 'Hành làm tôi khóc.', hint: '🧅' },
  { id: 'en_383', lang: 'en', term: 'corn', phonetic: '/kɔːrn/', translation: 'ngô', level: 2, pos: 'danh từ', example: 'Yellow corn is sweet.', exampleTranslation: 'Ngô vàng ngọt.', hint: '🌽' },
  { id: 'en_384', lang: 'en', term: 'mango', phonetic: '/ˈmæŋɡoʊ/', translation: 'xoài', level: 2, pos: 'danh từ', example: 'I love mangoes.', exampleTranslation: 'Tôi yêu xoài.', hint: '🥭' },
  { id: 'en_385', lang: 'en', term: 'grape', phonetic: '/ɡreɪp/', translation: 'nho', level: 2, pos: 'danh từ', example: 'Purple grapes are sweet.', exampleTranslation: 'Nho tím ngọt.', hint: '🍇' },
  { id: 'en_386', lang: 'en', term: 'strawberry', phonetic: '/ˈstrɔːberi/', translation: 'dâu tây', level: 2, pos: 'danh từ', example: 'I like strawberries.', exampleTranslation: 'Tôi thích dâu tây.', hint: '🍓' },
  { id: 'en_387', lang: 'en', term: 'watermelon', phonetic: '/ˈwɔːtərmelən/', translation: 'dưa hấu', level: 2, pos: 'danh từ', example: 'Watermelon is juicy.', exampleTranslation: 'Dưa hấu nhiều nước.', hint: '🍉' },
  { id: 'en_388', lang: 'en', term: 'lemon', phonetic: '/ˈlemən/', translation: 'chanh', level: 2, pos: 'danh từ', example: 'Lemons are sour.', exampleTranslation: 'Chanh chua.', hint: '🍋' },
  { id: 'en_389', lang: 'en', term: 'pear', phonetic: '/per/', translation: 'lê', level: 2, pos: 'danh từ', example: 'Pears are sweet.', exampleTranslation: 'Lê ngọt.', hint: '🍐' },
  { id: 'en_390', lang: 'en', term: 'cheese', phonetic: '/tʃiːz/', translation: 'phô mai', level: 2, pos: 'danh từ', example: 'I like cheese.', exampleTranslation: 'Tôi thích phô mai.', hint: '🧀' },
  { id: 'en_391', lang: 'en', term: 'butter', phonetic: '/ˈbʌtər/', translation: 'bơ', level: 2, pos: 'danh từ', example: 'Butter on bread.', exampleTranslation: 'Bơ trên bánh mì.', hint: '🧈' },
  { id: 'en_392', lang: 'en', term: 'chocolate', phonetic: '/ˈtʃɒkələt/', translation: 'sô cô la', level: 2, pos: 'danh từ', example: 'I love chocolate.', exampleTranslation: 'Tôi yêu sô cô la.', hint: '🍫' },
  { id: 'en_393', lang: 'en', term: 'candy', phonetic: '/ˈkændi/', translation: 'kẹo', level: 2, pos: 'danh từ', example: 'Don\'t eat too much candy.', exampleTranslation: 'Đừng ăn quá nhiều kẹo.', hint: '🍬' },
  { id: 'en_394', lang: 'en', term: 'coffee', phonetic: '/ˈkɔːfi/', translation: 'cà phê', level: 2, pos: 'danh từ', example: 'Dad drinks coffee.', exampleTranslation: 'Bố uống cà phê.', hint: '☕' },
  { id: 'en_395', lang: 'en', term: 'cookie', phonetic: '/ˈkʊki/', translation: 'bánh quy', level: 2, pos: 'danh từ', example: 'I bake cookies.', exampleTranslation: 'Tôi nướng bánh quy.', hint: '🍪' },

  // ─── Body (more) + health ───────────────────────────────────────────
  { id: 'en_396', lang: 'en', term: 'finger', phonetic: '/ˈfɪŋɡər/', translation: 'ngón tay', level: 2, pos: 'danh từ', example: 'I have ten fingers.', exampleTranslation: 'Tôi có mười ngón tay.', hint: '☝️' },
  { id: 'en_397', lang: 'en', term: 'toe', phonetic: '/toʊ/', translation: 'ngón chân', level: 2, pos: 'danh từ', example: 'My toe hurts.', exampleTranslation: 'Ngón chân tôi đau.', hint: '🦶' },
  { id: 'en_398', lang: 'en', term: 'knee', phonetic: '/niː/', translation: 'đầu gối', level: 2, pos: 'danh từ', example: 'My knee is bruised.', exampleTranslation: 'Đầu gối tôi bầm.', hint: '🦵' },
  { id: 'en_399', lang: 'en', term: 'shoulder', phonetic: '/ˈʃoʊldər/', translation: 'vai', level: 2, pos: 'danh từ', example: 'My shoulder is sore.', exampleTranslation: 'Vai tôi đau.', hint: '🤷' },
  { id: 'en_400', lang: 'en', term: 'back', phonetic: '/bæk/', translation: 'lưng', level: 2, pos: 'danh từ', example: 'My back hurts.', exampleTranslation: 'Lưng tôi đau.', hint: '🦴' },
  { id: 'en_401', lang: 'en', term: 'stomach', phonetic: '/ˈstʌmək/', translation: 'bụng', level: 2, pos: 'danh từ', example: 'My stomach is full.', exampleTranslation: 'Bụng tôi no.', hint: '🤰' },
  { id: 'en_402', lang: 'en', term: 'sick', phonetic: '/sɪk/', translation: 'ốm', level: 2, pos: 'tính từ', example: 'I am sick today.', exampleTranslation: 'Hôm nay tôi ốm.', hint: '🤒' },
  { id: 'en_403', lang: 'en', term: 'healthy', phonetic: '/ˈhelθi/', translation: 'khỏe mạnh', level: 2, pos: 'tính từ', example: 'Eat healthy food.', exampleTranslation: 'Ăn đồ ăn khỏe mạnh.', hint: '💪' },
  { id: 'en_404', lang: 'en', term: 'hospital', phonetic: '/ˈhɒspɪtəl/', translation: 'bệnh viện', level: 2, pos: 'danh từ', example: 'Mom works at the hospital.', exampleTranslation: 'Mẹ làm ở bệnh viện.', hint: '🏥' },
  { id: 'en_405', lang: 'en', term: 'medicine', phonetic: '/ˈmedəsən/', translation: 'thuốc', level: 2, pos: 'danh từ', example: 'Take your medicine.', exampleTranslation: 'Uống thuốc đi.', hint: '💊' },

  // ─── Feelings + character ───────────────────────────────────────────
  { id: 'en_406', lang: 'en', term: 'angry', phonetic: '/ˈæŋɡri/', translation: 'tức giận', level: 2, pos: 'tính từ', example: 'Mom is angry.', exampleTranslation: 'Mẹ giận.', hint: '😠' },
  { id: 'en_407', lang: 'en', term: 'tired', phonetic: '/ˈtaɪərd/', translation: 'mệt', level: 2, pos: 'tính từ', example: 'I am very tired.', exampleTranslation: 'Tôi rất mệt.', hint: '😴' },
  { id: 'en_408', lang: 'en', term: 'hungry', phonetic: '/ˈhʌŋɡri/', translation: 'đói', level: 2, pos: 'tính từ', example: 'I am hungry.', exampleTranslation: 'Tôi đói.', hint: '🍽️' },
  { id: 'en_409', lang: 'en', term: 'thirsty', phonetic: '/ˈθɜːrsti/', translation: 'khát', level: 2, pos: 'tính từ', example: 'I am thirsty.', exampleTranslation: 'Tôi khát.', hint: '💧' },
  { id: 'en_410', lang: 'en', term: 'scared', phonetic: '/skerd/', translation: 'sợ hãi', level: 2, pos: 'tính từ', example: 'The cat is scared.', exampleTranslation: 'Con mèo sợ.', hint: '😱' },
  { id: 'en_411', lang: 'en', term: 'excited', phonetic: '/ɪkˈsaɪtɪd/', translation: 'phấn khích', level: 2, pos: 'tính từ', example: 'I am excited!', exampleTranslation: 'Tôi háo hức!', hint: '🤩' },
  { id: 'en_412', lang: 'en', term: 'kind', phonetic: '/kaɪnd/', translation: 'tốt bụng', level: 2, pos: 'tính từ', example: 'My teacher is kind.', exampleTranslation: 'Cô tôi tốt bụng.', hint: '💕' },
  { id: 'en_413', lang: 'en', term: 'brave', phonetic: '/breɪv/', translation: 'dũng cảm', level: 2, pos: 'tính từ', example: 'The boy is brave.', exampleTranslation: 'Cậu bé dũng cảm.', hint: '🦸' },
  { id: 'en_414', lang: 'en', term: 'shy', phonetic: '/ʃaɪ/', translation: 'nhút nhát', level: 2, pos: 'tính từ', example: 'She is shy.', exampleTranslation: 'Cô ấy nhút nhát.', hint: '😳' },
  { id: 'en_415', lang: 'en', term: 'smart', phonetic: '/smɑːrt/', translation: 'thông minh', level: 2, pos: 'tính từ', example: 'My sister is smart.', exampleTranslation: 'Chị tôi thông minh.', hint: '🧠' },
  { id: 'en_416', lang: 'en', term: 'lazy', phonetic: '/ˈleɪzi/', translation: 'lười', level: 2, pos: 'tính từ', example: 'Don\'t be lazy.', exampleTranslation: 'Đừng lười.', hint: '🦥' },

  // ─── More adjectives (opposites) ────────────────────────────────────
  { id: 'en_417', lang: 'en', term: 'easy', phonetic: '/ˈiːzi/', translation: 'dễ', level: 2, pos: 'tính từ', example: 'This game is easy.', exampleTranslation: 'Trò này dễ.', hint: '😊' },
  { id: 'en_418', lang: 'en', term: 'hard', phonetic: '/hɑːrd/', translation: 'khó', level: 2, pos: 'tính từ', example: 'Math is hard.', exampleTranslation: 'Toán khó.', hint: '😣' },
  { id: 'en_419', lang: 'en', term: 'clean', phonetic: '/kliːn/', translation: 'sạch', level: 2, pos: 'tính từ', example: 'My room is clean.', exampleTranslation: 'Phòng tôi sạch.', hint: '✨' },
  { id: 'en_420', lang: 'en', term: 'dirty', phonetic: '/ˈdɜːrti/', translation: 'bẩn', level: 2, pos: 'tính từ', example: 'My hands are dirty.', exampleTranslation: 'Tay tôi bẩn.', hint: '🚿' },
  { id: 'en_421', lang: 'en', term: 'full', phonetic: '/fʊl/', translation: 'đầy', level: 2, pos: 'tính từ', example: 'The cup is full.', exampleTranslation: 'Cái cốc đầy.', hint: '🥛' },
  { id: 'en_422', lang: 'en', term: 'empty', phonetic: '/ˈempti/', translation: 'rỗng', level: 2, pos: 'tính từ', example: 'My bag is empty.', exampleTranslation: 'Cặp tôi rỗng.', hint: '📭' },
  { id: 'en_423', lang: 'en', term: 'wet', phonetic: '/wet/', translation: 'ướt', level: 2, pos: 'tính từ', example: 'My hair is wet.', exampleTranslation: 'Tóc tôi ướt.', hint: '💧' },
  { id: 'en_424', lang: 'en', term: 'dry', phonetic: '/draɪ/', translation: 'khô', level: 2, pos: 'tính từ', example: 'The towel is dry.', exampleTranslation: 'Khăn khô.', hint: '🏜️' },
  { id: 'en_425', lang: 'en', term: 'open', phonetic: '/ˈoʊpən/', translation: 'mở', level: 2, pos: 'tính từ', example: 'The shop is open.', exampleTranslation: 'Cửa hàng mở.', hint: '🚪' },
  { id: 'en_426', lang: 'en', term: 'closed', phonetic: '/kloʊzd/', translation: 'đóng', level: 2, pos: 'tính từ', example: 'The door is closed.', exampleTranslation: 'Cửa đóng.', hint: '🚫' },
  { id: 'en_427', lang: 'en', term: 'right', phonetic: '/raɪt/', translation: 'đúng/phải', level: 2, pos: 'tính từ', example: 'You are right.', exampleTranslation: 'Bạn đúng.', hint: '✅' },
  { id: 'en_428', lang: 'en', term: 'wrong', phonetic: '/rɒŋ/', translation: 'sai', level: 2, pos: 'tính từ', example: 'My answer is wrong.', exampleTranslation: 'Câu trả lời của tôi sai.', hint: '❌' },
  { id: 'en_429', lang: 'en', term: 'easy', phonetic: '/ˈiːzi/', translation: 'dễ dàng', level: 2, pos: 'tính từ', example: 'It\'s easy to learn.', exampleTranslation: 'Học dễ.', hint: '🎯' },
  { id: 'en_430', lang: 'en', term: 'expensive', phonetic: '/ɪkˈspensɪv/', translation: 'đắt', level: 2, pos: 'tính từ', example: 'That bag is expensive.', exampleTranslation: 'Cái túi đó đắt.', hint: '💰' },
  { id: 'en_431', lang: 'en', term: 'cheap', phonetic: '/tʃiːp/', translation: 'rẻ', level: 2, pos: 'tính từ', example: 'These books are cheap.', exampleTranslation: 'Sách này rẻ.', hint: '💸' },
  { id: 'en_432', lang: 'en', term: 'beautiful', phonetic: '/ˈbjuːtəfəl/', translation: 'đẹp', level: 2, pos: 'tính từ', example: 'The garden is beautiful.', exampleTranslation: 'Vườn đẹp.', hint: '🌹' },
  { id: 'en_433', lang: 'en', term: 'ugly', phonetic: '/ˈʌɡli/', translation: 'xấu', level: 2, pos: 'tính từ', example: 'The mask is ugly.', exampleTranslation: 'Mặt nạ xấu.', hint: '👹' },
  { id: 'en_434', lang: 'en', term: 'young', phonetic: '/jʌŋ/', translation: 'trẻ', level: 2, pos: 'tính từ', example: 'My sister is young.', exampleTranslation: 'Chị tôi trẻ.', hint: '👶' },

  // ─── Animals (more) ─────────────────────────────────────────────────
  { id: 'en_435', lang: 'en', term: 'butterfly', phonetic: '/ˈbʌtərflaɪ/', translation: 'bướm', level: 2, pos: 'danh từ', example: 'A butterfly is pretty.', exampleTranslation: 'Bướm đẹp.', hint: '🦋' },
  { id: 'en_436', lang: 'en', term: 'bee', phonetic: '/biː/', translation: 'con ong', level: 2, pos: 'danh từ', example: 'Bees make honey.', exampleTranslation: 'Ong làm mật.', hint: '🐝' },
  { id: 'en_437', lang: 'en', term: 'spider', phonetic: '/ˈspaɪdər/', translation: 'nhện', level: 2, pos: 'danh từ', example: 'I see a spider.', exampleTranslation: 'Tôi thấy con nhện.', hint: '🕷️' },
  { id: 'en_438', lang: 'en', term: 'turtle', phonetic: '/ˈtɜːrtəl/', translation: 'con rùa', level: 2, pos: 'danh từ', example: 'The turtle is slow.', exampleTranslation: 'Con rùa chậm.', hint: '🐢' },
  { id: 'en_439', lang: 'en', term: 'dolphin', phonetic: '/ˈdɒlfɪn/', translation: 'cá heo', level: 2, pos: 'danh từ', example: 'Dolphins are smart.', exampleTranslation: 'Cá heo thông minh.', hint: '🐬' },
  { id: 'en_440', lang: 'en', term: 'shark', phonetic: '/ʃɑːrk/', translation: 'cá mập', level: 2, pos: 'danh từ', example: 'Sharks live in oceans.', exampleTranslation: 'Cá mập sống ở biển.', hint: '🦈' },
  { id: 'en_441', lang: 'en', term: 'whale', phonetic: '/weɪl/', translation: 'cá voi', level: 2, pos: 'danh từ', example: 'Whales are huge.', exampleTranslation: 'Cá voi rất lớn.', hint: '🐳' },
  { id: 'en_442', lang: 'en', term: 'penguin', phonetic: '/ˈpeŋɡwɪn/', translation: 'chim cánh cụt', level: 2, pos: 'danh từ', example: 'Penguins live in ice.', exampleTranslation: 'Cánh cụt sống ở băng.', hint: '🐧' },
  { id: 'en_443', lang: 'en', term: 'kangaroo', phonetic: '/ˌkæŋɡəˈruː/', translation: 'kangaroo', level: 2, pos: 'danh từ', example: 'Kangaroos hop.', exampleTranslation: 'Kangaroo nhảy.', hint: '🦘' },
  { id: 'en_444', lang: 'en', term: 'panda', phonetic: '/ˈpændə/', translation: 'gấu trúc', level: 2, pos: 'danh từ', example: 'Pandas eat bamboo.', exampleTranslation: 'Gấu trúc ăn tre.', hint: '🐼' },
  { id: 'en_445', lang: 'en', term: 'giraffe', phonetic: '/dʒəˈræf/', translation: 'hươu cao cổ', level: 2, pos: 'danh từ', example: 'Giraffes are tall.', exampleTranslation: 'Hươu cao cổ rất cao.', hint: '🦒' },
  { id: 'en_446', lang: 'en', term: 'zebra', phonetic: '/ˈziːbrə/', translation: 'ngựa vằn', level: 2, pos: 'danh từ', example: 'Zebras have stripes.', exampleTranslation: 'Ngựa vằn có sọc.', hint: '🦓' },

  // ─── Home (more) ────────────────────────────────────────────────────
  { id: 'en_447', lang: 'en', term: 'living room', phonetic: '/ˈlɪvɪŋ ruːm/', translation: 'phòng khách', level: 2, pos: 'danh từ', example: 'The living room is big.', exampleTranslation: 'Phòng khách rộng.', hint: '🛋️' },
  { id: 'en_448', lang: 'en', term: 'garden', phonetic: '/ˈɡɑːrdən/', translation: 'khu vườn', level: 2, pos: 'danh từ', example: 'My garden has flowers.', exampleTranslation: 'Vườn tôi có hoa.', hint: '🌷' },
  { id: 'en_449', lang: 'en', term: 'lamp', phonetic: '/læmp/', translation: 'đèn', level: 2, pos: 'danh từ', example: 'Turn on the lamp.', exampleTranslation: 'Bật đèn lên.', hint: '💡' },
  { id: 'en_450', lang: 'en', term: 'mirror', phonetic: '/ˈmɪrər/', translation: 'cái gương', level: 2, pos: 'danh từ', example: 'I look in the mirror.', exampleTranslation: 'Tôi soi gương.', hint: '🪞' },
  { id: 'en_451', lang: 'en', term: 'sofa', phonetic: '/ˈsoʊfə/', translation: 'ghế sofa', level: 2, pos: 'danh từ', example: 'Sit on the sofa.', exampleTranslation: 'Ngồi xuống sofa.', hint: '🛋️' },
  { id: 'en_452', lang: 'en', term: 'TV', phonetic: '/ˌtiː ˈviː/', translation: 'tivi', level: 2, pos: 'danh từ', example: 'Watch TV with me.', exampleTranslation: 'Xem tivi với tôi.', hint: '📺' },
  { id: 'en_453', lang: 'en', term: 'fridge', phonetic: '/frɪdʒ/', translation: 'tủ lạnh', level: 2, pos: 'danh từ', example: 'Milk is in the fridge.', exampleTranslation: 'Sữa trong tủ lạnh.', hint: '🧊' },
  { id: 'en_454', lang: 'en', term: 'plate', phonetic: '/pleɪt/', translation: 'cái đĩa', level: 2, pos: 'danh từ', example: 'A clean plate.', exampleTranslation: 'Một cái đĩa sạch.', hint: '🍽️' },
  { id: 'en_455', lang: 'en', term: 'cup', phonetic: '/kʌp/', translation: 'cái cốc', level: 2, pos: 'danh từ', example: 'A cup of tea.', exampleTranslation: 'Một cốc trà.', hint: '☕' },
  { id: 'en_456', lang: 'en', term: 'spoon', phonetic: '/spuːn/', translation: 'cái thìa', level: 2, pos: 'danh từ', example: 'Use a spoon.', exampleTranslation: 'Dùng thìa đi.', hint: '🥄' },
  { id: 'en_457', lang: 'en', term: 'fork', phonetic: '/fɔːrk/', translation: 'cái nĩa', level: 2, pos: 'danh từ', example: 'A clean fork.', exampleTranslation: 'Một cái nĩa sạch.', hint: '🍴' },
  { id: 'en_458', lang: 'en', term: 'knife', phonetic: '/naɪf/', translation: 'con dao', level: 2, pos: 'danh từ', example: 'Be careful with the knife.', exampleTranslation: 'Cẩn thận con dao.', hint: '🔪' },

  // ─── Cooking + actions ──────────────────────────────────────────────
  { id: 'en_459', lang: 'en', term: 'cook', phonetic: '/kʊk/', translation: 'nấu ăn', level: 2, pos: 'động từ', example: 'Mom cooks dinner.', exampleTranslation: 'Mẹ nấu cơm tối.', hint: '🍳' },
  { id: 'en_460', lang: 'en', term: 'cut', phonetic: '/kʌt/', translation: 'cắt', level: 2, pos: 'động từ', example: 'Cut the apple.', exampleTranslation: 'Cắt quả táo.', hint: '✂️' },
  { id: 'en_461', lang: 'en', term: 'mix', phonetic: '/mɪks/', translation: 'trộn', level: 2, pos: 'động từ', example: 'Mix the eggs.', exampleTranslation: 'Trộn trứng.', hint: '🥄' },
  { id: 'en_462', lang: 'en', term: 'wash', phonetic: '/wɒʃ/', translation: 'rửa', level: 2, pos: 'động từ', example: 'Wash the plates.', exampleTranslation: 'Rửa đĩa.', hint: '🧼' },
  { id: 'en_463', lang: 'en', term: 'help', phonetic: '/help/', translation: 'giúp đỡ', level: 2, pos: 'động từ', example: 'I help my mom.', exampleTranslation: 'Tôi giúp mẹ.', hint: '🤝' },
  { id: 'en_464', lang: 'en', term: 'clean', phonetic: '/kliːn/', translation: 'lau dọn', level: 2, pos: 'động từ', example: 'Clean your room.', exampleTranslation: 'Dọn phòng đi.', hint: '🧹' },
  { id: 'en_465', lang: 'en', term: 'find', phonetic: '/faɪnd/', translation: 'tìm thấy', level: 2, pos: 'động từ', example: 'Can you find it?', exampleTranslation: 'Bạn tìm được không?', hint: '🔍' },
  { id: 'en_466', lang: 'en', term: 'lose', phonetic: '/luːz/', translation: 'mất', level: 2, pos: 'động từ', example: 'Don\'t lose your key.', exampleTranslation: 'Đừng làm mất chìa khóa.', hint: '🔑' },
  { id: 'en_467', lang: 'en', term: 'buy', phonetic: '/baɪ/', translation: 'mua', level: 2, pos: 'động từ', example: 'I buy a book.', exampleTranslation: 'Tôi mua một quyển sách.', hint: '🛍️' },
  { id: 'en_468', lang: 'en', term: 'sell', phonetic: '/sel/', translation: 'bán', level: 2, pos: 'động từ', example: 'They sell ice cream.', exampleTranslation: 'Họ bán kem.', hint: '🛒' },
  { id: 'en_469', lang: 'en', term: 'pay', phonetic: '/peɪ/', translation: 'trả tiền', level: 2, pos: 'động từ', example: 'I pay for it.', exampleTranslation: 'Tôi trả tiền.', hint: '💵' },
  { id: 'en_470', lang: 'en', term: 'give', phonetic: '/ɡɪv/', translation: 'cho/đưa', level: 2, pos: 'động từ', example: 'Give me a pen.', exampleTranslation: 'Đưa tôi cây bút.', hint: '🤲' },
  { id: 'en_471', lang: 'en', term: 'take', phonetic: '/teɪk/', translation: 'lấy', level: 2, pos: 'động từ', example: 'Take this book.', exampleTranslation: 'Cầm quyển sách này.', hint: '🤚' },
  { id: 'en_472', lang: 'en', term: 'bring', phonetic: '/brɪŋ/', translation: 'mang đến', level: 2, pos: 'động từ', example: 'Bring me water.', exampleTranslation: 'Mang nước cho tôi.', hint: '🥤' },
  { id: 'en_473', lang: 'en', term: 'show', phonetic: '/ʃoʊ/', translation: 'cho xem', level: 2, pos: 'động từ', example: 'Show me your book.', exampleTranslation: 'Cho tôi xem sách.', hint: '👀' },
  { id: 'en_474', lang: 'en', term: 'tell', phonetic: '/tel/', translation: 'kể/bảo', level: 2, pos: 'động từ', example: 'Tell me a story.', exampleTranslation: 'Kể tôi nghe chuyện.', hint: '🗣️' },
  { id: 'en_475', lang: 'en', term: 'ask', phonetic: '/æsk/', translation: 'hỏi', level: 2, pos: 'động từ', example: 'Ask the teacher.', exampleTranslation: 'Hỏi cô giáo.', hint: '❓' },
  { id: 'en_476', lang: 'en', term: 'answer', phonetic: '/ˈænsər/', translation: 'trả lời', level: 2, pos: 'động từ', example: 'Answer the question.', exampleTranslation: 'Trả lời câu hỏi.', hint: '💬' },
  { id: 'en_477', lang: 'en', term: 'think', phonetic: '/θɪŋk/', translation: 'nghĩ', level: 2, pos: 'động từ', example: 'I think it\'s good.', exampleTranslation: 'Tôi nghĩ nó tốt.', hint: '🤔' },
  { id: 'en_478', lang: 'en', term: 'remember', phonetic: '/rɪˈmembər/', translation: 'nhớ', level: 2, pos: 'động từ', example: 'Remember your homework.', exampleTranslation: 'Nhớ làm bài.', hint: '🧠' },
  { id: 'en_479', lang: 'en', term: 'forget', phonetic: '/fərˈɡet/', translation: 'quên', level: 2, pos: 'động từ', example: 'Don\'t forget me.', exampleTranslation: 'Đừng quên tôi.', hint: '😅' },

  // ─── Misc closers ───────────────────────────────────────────────────
  { id: 'en_480', lang: 'en', term: 'always', phonetic: '/ˈɔːlweɪz/', translation: 'luôn luôn', level: 2, pos: 'trạng từ', example: 'I always help.', exampleTranslation: 'Tôi luôn giúp.', hint: '♾️' },
  { id: 'en_481', lang: 'en', term: 'never', phonetic: '/ˈnevər/', translation: 'không bao giờ', level: 2, pos: 'trạng từ', example: 'I never lie.', exampleTranslation: 'Tôi không bao giờ nói dối.', hint: '🚫' },
  { id: 'en_482', lang: 'en', term: 'sometimes', phonetic: '/ˈsʌmtaɪmz/', translation: 'thỉnh thoảng', level: 2, pos: 'trạng từ', example: 'Sometimes I cry.', exampleTranslation: 'Thỉnh thoảng tôi khóc.', hint: '🌗' },
  { id: 'en_483', lang: 'en', term: 'usually', phonetic: '/ˈjuːʒuəli/', translation: 'thường', level: 2, pos: 'trạng từ', example: 'I usually walk.', exampleTranslation: 'Tôi thường đi bộ.', hint: '📊' },
  { id: 'en_484', lang: 'en', term: 'because', phonetic: '/bɪˈkɒz/', translation: 'bởi vì', level: 2, pos: 'liên từ', example: 'I cry because I\'m sad.', exampleTranslation: 'Tôi khóc vì buồn.', hint: '➡️' },
  { id: 'en_485', lang: 'en', term: 'so', phonetic: '/soʊ/', translation: 'vì vậy', level: 2, pos: 'liên từ', example: 'I\'m tired so I sleep.', exampleTranslation: 'Tôi mệt nên tôi ngủ.', hint: '➡️' },
  { id: 'en_486', lang: 'en', term: 'before', phonetic: '/bɪˈfɔːr/', translation: 'trước khi', level: 2, pos: 'giới từ', example: 'Wash hands before eating.', exampleTranslation: 'Rửa tay trước khi ăn.', hint: '⏪' },
  { id: 'en_487', lang: 'en', term: 'after', phonetic: '/ˈæftər/', translation: 'sau khi', level: 2, pos: 'giới từ', example: 'I sleep after dinner.', exampleTranslation: 'Tôi ngủ sau bữa tối.', hint: '⏩' },
  { id: 'en_488', lang: 'en', term: 'between', phonetic: '/bɪˈtwiːn/', translation: 'giữa', level: 2, pos: 'giới từ', example: 'Sit between us.', exampleTranslation: 'Ngồi giữa chúng tôi.', hint: '↔️' },
  { id: 'en_489', lang: 'en', term: 'next to', phonetic: '/nekst tuː/', translation: 'kế bên', level: 2, pos: 'giới từ', example: 'Sit next to me.', exampleTranslation: 'Ngồi cạnh tôi.', hint: '➡️' },
  { id: 'en_490', lang: 'en', term: 'left', phonetic: '/left/', translation: 'bên trái', level: 2, pos: 'danh từ', example: 'Turn left.', exampleTranslation: 'Rẽ trái.', hint: '⬅️' },
  { id: 'en_491', lang: 'en', term: 'right', phonetic: '/raɪt/', translation: 'bên phải', level: 2, pos: 'danh từ', example: 'Turn right.', exampleTranslation: 'Rẽ phải.', hint: '➡️' },
  { id: 'en_492', lang: 'en', term: 'inside', phonetic: '/ɪnˈsaɪd/', translation: 'bên trong', level: 2, pos: 'giới từ', example: 'Inside the house.', exampleTranslation: 'Trong nhà.', hint: '🏠' },
  { id: 'en_493', lang: 'en', term: 'outside', phonetic: '/ˌaʊtˈsaɪd/', translation: 'bên ngoài', level: 2, pos: 'giới từ', example: 'Play outside.', exampleTranslation: 'Chơi ngoài.', hint: '🌳' },

  // ─── More animals/plants ────────────────────────────────────────────
  { id: 'en_494', lang: 'en', term: 'forest', phonetic: '/ˈfɒrəst/', translation: 'rừng', level: 2, pos: 'danh từ', example: 'Animals live in forests.', exampleTranslation: 'Động vật sống trong rừng.', hint: '🌲' },
  { id: 'en_495', lang: 'en', term: 'sea', phonetic: '/siː/', translation: 'biển', level: 2, pos: 'danh từ', example: 'I love the sea.', exampleTranslation: 'Tôi yêu biển.', hint: '🌊' },
  { id: 'en_496', lang: 'en', term: 'beach', phonetic: '/biːtʃ/', translation: 'bãi biển', level: 2, pos: 'danh từ', example: 'We play at the beach.', exampleTranslation: 'Chúng tôi chơi ở bãi biển.', hint: '🏖️' },
  { id: 'en_497', lang: 'en', term: 'mountain', phonetic: '/ˈmaʊntən/', translation: 'núi', level: 2, pos: 'danh từ', example: 'The mountain is high.', exampleTranslation: 'Núi cao.', hint: '⛰️' },
  { id: 'en_498', lang: 'en', term: 'river', phonetic: '/ˈrɪvər/', translation: 'sông', level: 2, pos: 'danh từ', example: 'A long river.', exampleTranslation: 'Con sông dài.', hint: '🏞️' },
  { id: 'en_499', lang: 'en', term: 'island', phonetic: '/ˈaɪlənd/', translation: 'đảo', level: 2, pos: 'danh từ', example: 'A small island.', exampleTranslation: 'Một hòn đảo nhỏ.', hint: '🏝️' },
  { id: 'en_500', lang: 'en', term: 'lake', phonetic: '/leɪk/', translation: 'hồ', level: 2, pos: 'danh từ', example: 'The lake is calm.', exampleTranslation: 'Hồ yên tĩnh.', hint: '💧' },
];
