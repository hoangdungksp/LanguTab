import type { Word } from '../../types';

/**
 * Level 3 — Cambridge Flyers-equivalent vocabulary.
 *
 * Target audience: trẻ em 10-12 tuổi, học sinh lớp 5-6, A2 CEFR.
 * Builds on Levels 1 + 2 with ~400 NEW words (no duplicates from earlier
 * levels).
 *
 * Topic expansion vs Level 2:
 *   - Past tense verbs (regular + common irregular)
 *   - Comparative + superlative adjectives
 *   - More abstract concepts (still concrete enough for kids)
 *   - Travel + holiday vocabulary
 *   - Environment + nature (deeper)
 *   - Technology basic (computer, phone)
 *   - More countries + nationalities
 *   - Music + entertainment
 *   - Cooking + recipes
 *
 * User-facing label: "Cấp 3 — Trung cấp" (avoids Cambridge trademark).
 */
export const enLevel3: Word[] = [
  // ─── Past tense verbs (regular) ─────────────────────────────────────
  { id: 'en_501', lang: 'en', term: 'walked', phonetic: '/wɔːkt/', translation: 'đã đi bộ', level: 3, pos: 'động từ quá khứ', example: 'I walked to school.', exampleTranslation: 'Tôi đã đi bộ đến trường.', hint: '⏪' },
  { id: 'en_502', lang: 'en', term: 'played', phonetic: '/pleɪd/', translation: 'đã chơi', level: 3, pos: 'động từ quá khứ', example: 'We played football.', exampleTranslation: 'Chúng tôi đã chơi bóng.', hint: '⏪' },
  { id: 'en_503', lang: 'en', term: 'watched', phonetic: '/wɒtʃt/', translation: 'đã xem', level: 3, pos: 'động từ quá khứ', example: 'I watched a movie.', exampleTranslation: 'Tôi đã xem phim.', hint: '⏪' },
  { id: 'en_504', lang: 'en', term: 'visited', phonetic: '/ˈvɪzɪtɪd/', translation: 'đã thăm', level: 3, pos: 'động từ quá khứ', example: 'We visited grandma.', exampleTranslation: 'Chúng tôi đã thăm bà.', hint: '⏪' },
  { id: 'en_505', lang: 'en', term: 'stayed', phonetic: '/steɪd/', translation: 'đã ở lại', level: 3, pos: 'động từ quá khứ', example: 'I stayed home.', exampleTranslation: 'Tôi đã ở nhà.', hint: '⏪' },
  { id: 'en_506', lang: 'en', term: 'liked', phonetic: '/laɪkt/', translation: 'đã thích', level: 3, pos: 'động từ quá khứ', example: 'She liked the cake.', exampleTranslation: 'Cô ấy đã thích cái bánh.', hint: '⏪' },
  { id: 'en_507', lang: 'en', term: 'wanted', phonetic: '/ˈwɒntɪd/', translation: 'đã muốn', level: 3, pos: 'động từ quá khứ', example: 'I wanted ice cream.', exampleTranslation: 'Tôi đã muốn ăn kem.', hint: '⏪' },
  { id: 'en_508', lang: 'en', term: 'looked', phonetic: '/lʊkt/', translation: 'đã nhìn', level: 3, pos: 'động từ quá khứ', example: 'I looked at the sky.', exampleTranslation: 'Tôi đã nhìn lên bầu trời.', hint: '⏪' },
  { id: 'en_509', lang: 'en', term: 'helped', phonetic: '/helpt/', translation: 'đã giúp', level: 3, pos: 'động từ quá khứ', example: 'He helped me yesterday.', exampleTranslation: 'Anh ấy đã giúp tôi hôm qua.', hint: '⏪' },
  { id: 'en_510', lang: 'en', term: 'asked', phonetic: '/æskt/', translation: 'đã hỏi', level: 3, pos: 'động từ quá khứ', example: 'I asked the teacher.', exampleTranslation: 'Tôi đã hỏi cô giáo.', hint: '⏪' },

  // ─── Past tense verbs (irregular) ───────────────────────────────────
  { id: 'en_511', lang: 'en', term: 'went', phonetic: '/went/', translation: 'đã đi', level: 3, pos: 'động từ quá khứ', example: 'I went to the park.', exampleTranslation: 'Tôi đã đi công viên.', hint: '⏪' },
  { id: 'en_512', lang: 'en', term: 'saw', phonetic: '/sɔː/', translation: 'đã thấy', level: 3, pos: 'động từ quá khứ', example: 'I saw a rainbow.', exampleTranslation: 'Tôi đã thấy cầu vồng.', hint: '⏪' },
  { id: 'en_513', lang: 'en', term: 'ate', phonetic: '/eɪt/', translation: 'đã ăn', level: 3, pos: 'động từ quá khứ', example: 'I ate breakfast.', exampleTranslation: 'Tôi đã ăn sáng.', hint: '⏪' },
  { id: 'en_514', lang: 'en', term: 'drank', phonetic: '/dræŋk/', translation: 'đã uống', level: 3, pos: 'động từ quá khứ', example: 'She drank her milk.', exampleTranslation: 'Cô ấy đã uống sữa.', hint: '⏪' },
  { id: 'en_515', lang: 'en', term: 'made', phonetic: '/meɪd/', translation: 'đã làm', level: 3, pos: 'động từ quá khứ', example: 'Mom made dinner.', exampleTranslation: 'Mẹ đã nấu cơm.', hint: '⏪' },
  { id: 'en_516', lang: 'en', term: 'gave', phonetic: '/ɡeɪv/', translation: 'đã đưa', level: 3, pos: 'động từ quá khứ', example: 'Dad gave me a gift.', exampleTranslation: 'Bố đã cho tôi quà.', hint: '⏪' },
  { id: 'en_517', lang: 'en', term: 'took', phonetic: '/tʊk/', translation: 'đã lấy', level: 3, pos: 'động từ quá khứ', example: 'I took the bus.', exampleTranslation: 'Tôi đã đi xe buýt.', hint: '⏪' },
  { id: 'en_518', lang: 'en', term: 'came', phonetic: '/keɪm/', translation: 'đã đến', level: 3, pos: 'động từ quá khứ', example: 'They came late.', exampleTranslation: 'Họ đã đến muộn.', hint: '⏪' },
  { id: 'en_519', lang: 'en', term: 'said', phonetic: '/sed/', translation: 'đã nói', level: 3, pos: 'động từ quá khứ', example: 'She said hello.', exampleTranslation: 'Cô ấy đã chào.', hint: '⏪' },
  { id: 'en_520', lang: 'en', term: 'told', phonetic: '/toʊld/', translation: 'đã kể', level: 3, pos: 'động từ quá khứ', example: 'Mom told a story.', exampleTranslation: 'Mẹ đã kể chuyện.', hint: '⏪' },
  { id: 'en_521', lang: 'en', term: 'thought', phonetic: '/θɔːt/', translation: 'đã nghĩ', level: 3, pos: 'động từ quá khứ', example: 'I thought about it.', exampleTranslation: 'Tôi đã nghĩ về nó.', hint: '⏪' },
  { id: 'en_522', lang: 'en', term: 'bought', phonetic: '/bɔːt/', translation: 'đã mua', level: 3, pos: 'động từ quá khứ', example: 'I bought a book.', exampleTranslation: 'Tôi đã mua sách.', hint: '⏪' },
  { id: 'en_523', lang: 'en', term: 'found', phonetic: '/faʊnd/', translation: 'đã tìm thấy', level: 3, pos: 'động từ quá khứ', example: 'I found my key.', exampleTranslation: 'Tôi đã tìm thấy chìa khóa.', hint: '⏪' },
  { id: 'en_524', lang: 'en', term: 'wrote', phonetic: '/roʊt/', translation: 'đã viết', level: 3, pos: 'động từ quá khứ', example: 'She wrote a letter.', exampleTranslation: 'Cô ấy đã viết thư.', hint: '⏪' },
  { id: 'en_525', lang: 'en', term: 'read', phonetic: '/red/', translation: 'đã đọc', level: 3, pos: 'động từ quá khứ', example: 'I read a book yesterday.', exampleTranslation: 'Tôi đã đọc sách hôm qua.', hint: '⏪' },
  { id: 'en_526', lang: 'en', term: 'sang', phonetic: '/sæŋ/', translation: 'đã hát', level: 3, pos: 'động từ quá khứ', example: 'We sang together.', exampleTranslation: 'Chúng tôi đã hát.', hint: '⏪' },
  { id: 'en_527', lang: 'en', term: 'ran', phonetic: '/ræn/', translation: 'đã chạy', level: 3, pos: 'động từ quá khứ', example: 'The dog ran fast.', exampleTranslation: 'Con chó đã chạy nhanh.', hint: '⏪' },
  { id: 'en_528', lang: 'en', term: 'flew', phonetic: '/fluː/', translation: 'đã bay', level: 3, pos: 'động từ quá khứ', example: 'The bird flew away.', exampleTranslation: 'Con chim đã bay đi.', hint: '⏪' },
  { id: 'en_529', lang: 'en', term: 'caught', phonetic: '/kɔːt/', translation: 'đã bắt được', level: 3, pos: 'động từ quá khứ', example: 'I caught a fish.', exampleTranslation: 'Tôi đã bắt được cá.', hint: '⏪' },
  { id: 'en_530', lang: 'en', term: 'broke', phonetic: '/broʊk/', translation: 'đã làm vỡ', level: 3, pos: 'động từ quá khứ', example: 'I broke the cup.', exampleTranslation: 'Tôi đã làm vỡ cốc.', hint: '⏪' },

  // ─── Comparative + superlative ──────────────────────────────────────
  { id: 'en_531', lang: 'en', term: 'bigger', phonetic: '/ˈbɪɡər/', translation: 'to hơn', level: 3, pos: 'tính từ so sánh', example: 'My dog is bigger.', exampleTranslation: 'Chó tôi to hơn.', hint: '📈' },
  { id: 'en_532', lang: 'en', term: 'biggest', phonetic: '/ˈbɪɡəst/', translation: 'to nhất', level: 3, pos: 'tính từ cực cấp', example: 'The biggest tree.', exampleTranslation: 'Cây to nhất.', hint: '🏆' },
  { id: 'en_533', lang: 'en', term: 'smaller', phonetic: '/ˈsmɔːlər/', translation: 'nhỏ hơn', level: 3, pos: 'tính từ so sánh', example: 'A smaller box.', exampleTranslation: 'Hộp nhỏ hơn.', hint: '📉' },
  { id: 'en_534', lang: 'en', term: 'better', phonetic: '/ˈbetər/', translation: 'tốt hơn', level: 3, pos: 'tính từ so sánh', example: 'I feel better today.', exampleTranslation: 'Hôm nay tôi khỏe hơn.', hint: '⬆️' },
  { id: 'en_535', lang: 'en', term: 'best', phonetic: '/best/', translation: 'tốt nhất', level: 3, pos: 'tính từ cực cấp', example: 'You are the best.', exampleTranslation: 'Bạn giỏi nhất.', hint: '🥇' },
  { id: 'en_536', lang: 'en', term: 'worse', phonetic: '/wɜːrs/', translation: 'tệ hơn', level: 3, pos: 'tính từ so sánh', example: 'It got worse.', exampleTranslation: 'Nó tệ hơn.', hint: '⬇️' },
  { id: 'en_537', lang: 'en', term: 'worst', phonetic: '/wɜːrst/', translation: 'tệ nhất', level: 3, pos: 'tính từ cực cấp', example: 'My worst day ever.', exampleTranslation: 'Ngày tệ nhất.', hint: '😩' },
  { id: 'en_538', lang: 'en', term: 'older', phonetic: '/ˈoʊldər/', translation: 'già hơn', level: 3, pos: 'tính từ so sánh', example: 'My brother is older.', exampleTranslation: 'Anh tôi lớn hơn.', hint: '👴' },
  { id: 'en_539', lang: 'en', term: 'younger', phonetic: '/ˈjʌŋɡər/', translation: 'trẻ hơn', level: 3, pos: 'tính từ so sánh', example: 'My sister is younger.', exampleTranslation: 'Em tôi trẻ hơn.', hint: '👦' },
  { id: 'en_540', lang: 'en', term: 'taller', phonetic: '/ˈtɔːlər/', translation: 'cao hơn', level: 3, pos: 'tính từ so sánh', example: 'I am taller now.', exampleTranslation: 'Bây giờ tôi cao hơn.', hint: '📏' },
  { id: 'en_541', lang: 'en', term: 'tallest', phonetic: '/ˈtɔːləst/', translation: 'cao nhất', level: 3, pos: 'tính từ cực cấp', example: 'The tallest building.', exampleTranslation: 'Tòa nhà cao nhất.', hint: '🏙️' },
  { id: 'en_542', lang: 'en', term: 'faster', phonetic: '/ˈfæstər/', translation: 'nhanh hơn', level: 3, pos: 'tính từ so sánh', example: 'I run faster than you.', exampleTranslation: 'Tôi chạy nhanh hơn bạn.', hint: '🏃' },
  { id: 'en_543', lang: 'en', term: 'fastest', phonetic: '/ˈfæstəst/', translation: 'nhanh nhất', level: 3, pos: 'tính từ cực cấp', example: 'The fastest car.', exampleTranslation: 'Xe nhanh nhất.', hint: '🏁' },

  // ─── Travel + holiday ───────────────────────────────────────────────
  { id: 'en_544', lang: 'en', term: 'holiday', phonetic: '/ˈhɒlədeɪ/', translation: 'kỳ nghỉ', level: 3, pos: 'danh từ', example: 'Summer holiday is fun.', exampleTranslation: 'Nghỉ hè vui.', hint: '🏖️' },
  { id: 'en_545', lang: 'en', term: 'vacation', phonetic: '/veɪˈkeɪʃən/', translation: 'kỳ nghỉ', level: 3, pos: 'danh từ', example: 'We go on vacation.', exampleTranslation: 'Chúng tôi đi du lịch.', hint: '✈️' },
  { id: 'en_546', lang: 'en', term: 'travel', phonetic: '/ˈtrævəl/', translation: 'du lịch', level: 3, pos: 'động từ', example: 'I love to travel.', exampleTranslation: 'Tôi yêu du lịch.', hint: '🌍' },
  { id: 'en_547', lang: 'en', term: 'trip', phonetic: '/trɪp/', translation: 'chuyến đi', level: 3, pos: 'danh từ', example: 'A school trip is fun.', exampleTranslation: 'Chuyến đi của trường vui.', hint: '🎒' },
  { id: 'en_548', lang: 'en', term: 'hotel', phonetic: '/hoʊˈtel/', translation: 'khách sạn', level: 3, pos: 'danh từ', example: 'Stay at a hotel.', exampleTranslation: 'Ở khách sạn.', hint: '🏨' },
  { id: 'en_549', lang: 'en', term: 'airport', phonetic: '/ˈerpɔːrt/', translation: 'sân bay', level: 3, pos: 'danh từ', example: 'The airport is busy.', exampleTranslation: 'Sân bay đông đúc.', hint: '🛫' },
  { id: 'en_550', lang: 'en', term: 'station', phonetic: '/ˈsteɪʃən/', translation: 'ga/trạm', level: 3, pos: 'danh từ', example: 'Train station is here.', exampleTranslation: 'Ga tàu ở đây.', hint: '🚉' },
  { id: 'en_551', lang: 'en', term: 'ticket', phonetic: '/ˈtɪkɪt/', translation: 'vé', level: 3, pos: 'danh từ', example: 'Buy a ticket.', exampleTranslation: 'Mua vé đi.', hint: '🎫' },
  { id: 'en_552', lang: 'en', term: 'map', phonetic: '/mæp/', translation: 'bản đồ', level: 3, pos: 'danh từ', example: 'Look at the map.', exampleTranslation: 'Nhìn bản đồ.', hint: '🗺️' },
  { id: 'en_553', lang: 'en', term: 'camera', phonetic: '/ˈkæmərə/', translation: 'máy ảnh', level: 3, pos: 'danh từ', example: 'My camera is new.', exampleTranslation: 'Máy ảnh tôi mới.', hint: '📸' },
  { id: 'en_554', lang: 'en', term: 'suitcase', phonetic: '/ˈsuːtkeɪs/', translation: 'va li', level: 3, pos: 'danh từ', example: 'Pack your suitcase.', exampleTranslation: 'Đóng gói va li.', hint: '🧳' },
  { id: 'en_555', lang: 'en', term: 'passport', phonetic: '/ˈpæspɔːrt/', translation: 'hộ chiếu', level: 3, pos: 'danh từ', example: 'Bring your passport.', exampleTranslation: 'Mang theo hộ chiếu.', hint: '📔' },
  { id: 'en_556', lang: 'en', term: 'visit', phonetic: '/ˈvɪzɪt/', translation: 'thăm', level: 3, pos: 'động từ', example: 'I visit my aunt.', exampleTranslation: 'Tôi thăm dì.', hint: '🏠' },
  { id: 'en_557', lang: 'en', term: 'tour', phonetic: '/tʊr/', translation: 'chuyến tham quan', level: 3, pos: 'danh từ', example: 'A city tour is fun.', exampleTranslation: 'Tour thành phố vui.', hint: '🚌' },

  // ─── Countries + nationalities ──────────────────────────────────────
  { id: 'en_558', lang: 'en', term: 'country', phonetic: '/ˈkʌntri/', translation: 'đất nước', level: 3, pos: 'danh từ', example: 'My country is beautiful.', exampleTranslation: 'Đất nước tôi đẹp.', hint: '🌍' },
  { id: 'en_559', lang: 'en', term: 'Vietnam', phonetic: '/ˌvjetˈnɑːm/', translation: 'Việt Nam', level: 3, pos: 'danh từ riêng', example: 'I live in Vietnam.', exampleTranslation: 'Tôi sống ở Việt Nam.', hint: '🇻🇳' },
  { id: 'en_560', lang: 'en', term: 'America', phonetic: '/əˈmerɪkə/', translation: 'Mỹ', level: 3, pos: 'danh từ riêng', example: 'America is far.', exampleTranslation: 'Mỹ ở xa.', hint: '🇺🇸' },
  { id: 'en_561', lang: 'en', term: 'England', phonetic: '/ˈɪŋɡlənd/', translation: 'Anh', level: 3, pos: 'danh từ riêng', example: 'London is in England.', exampleTranslation: 'London ở Anh.', hint: '🇬🇧' },
  { id: 'en_562', lang: 'en', term: 'Japan', phonetic: '/dʒəˈpæn/', translation: 'Nhật', level: 3, pos: 'danh từ riêng', example: 'I want to visit Japan.', exampleTranslation: 'Tôi muốn thăm Nhật.', hint: '🇯🇵' },
  { id: 'en_563', lang: 'en', term: 'China', phonetic: '/ˈtʃaɪnə/', translation: 'Trung Quốc', level: 3, pos: 'danh từ riêng', example: 'China is huge.', exampleTranslation: 'Trung Quốc rộng lớn.', hint: '🇨🇳' },
  { id: 'en_564', lang: 'en', term: 'Australia', phonetic: '/ɒˈstreɪliə/', translation: 'Úc', level: 3, pos: 'danh từ riêng', example: 'Kangaroos live in Australia.', exampleTranslation: 'Kangaroo sống ở Úc.', hint: '🇦🇺' },
  { id: 'en_565', lang: 'en', term: 'language', phonetic: '/ˈlæŋɡwɪdʒ/', translation: 'ngôn ngữ', level: 3, pos: 'danh từ', example: 'English is a language.', exampleTranslation: 'Tiếng Anh là ngôn ngữ.', hint: '🗣️' },
  { id: 'en_566', lang: 'en', term: 'world', phonetic: '/wɜːrld/', translation: 'thế giới', level: 3, pos: 'danh từ', example: 'The world is big.', exampleTranslation: 'Thế giới rộng lớn.', hint: '🌐' },

  // ─── Technology ────────────────────────────────────────────────────
  { id: 'en_567', lang: 'en', term: 'computer', phonetic: '/kəmˈpjuːtər/', translation: 'máy tính', level: 3, pos: 'danh từ', example: 'I use the computer.', exampleTranslation: 'Tôi dùng máy tính.', hint: '💻' },
  { id: 'en_568', lang: 'en', term: 'laptop', phonetic: '/ˈlæptɒp/', translation: 'laptop', level: 3, pos: 'danh từ', example: 'My laptop is new.', exampleTranslation: 'Laptop tôi mới.', hint: '💻' },
  { id: 'en_569', lang: 'en', term: 'phone', phonetic: '/foʊn/', translation: 'điện thoại', level: 3, pos: 'danh từ', example: 'My phone is dead.', exampleTranslation: 'Điện thoại tôi hết pin.', hint: '📱' },
  { id: 'en_570', lang: 'en', term: 'tablet', phonetic: '/ˈtæblət/', translation: 'máy tính bảng', level: 3, pos: 'danh từ', example: 'Kids love tablets.', exampleTranslation: 'Trẻ thích máy tính bảng.', hint: '📱' },
  { id: 'en_571', lang: 'en', term: 'internet', phonetic: '/ˈɪntərnet/', translation: 'mạng Internet', level: 3, pos: 'danh từ', example: 'The internet is slow.', exampleTranslation: 'Mạng chậm.', hint: '🌐' },
  { id: 'en_572', lang: 'en', term: 'email', phonetic: '/ˈiːmeɪl/', translation: 'thư điện tử', level: 3, pos: 'danh từ', example: 'Send me an email.', exampleTranslation: 'Gửi tôi email.', hint: '📧' },
  { id: 'en_573', lang: 'en', term: 'website', phonetic: '/ˈwebsaɪt/', translation: 'trang web', level: 3, pos: 'danh từ', example: 'Visit the website.', exampleTranslation: 'Xem trang web.', hint: '🌐' },
  { id: 'en_574', lang: 'en', term: 'video', phonetic: '/ˈvɪdioʊ/', translation: 'video', level: 3, pos: 'danh từ', example: 'A funny video.', exampleTranslation: 'Một video buồn cười.', hint: '📹' },
  { id: 'en_575', lang: 'en', term: 'screen', phonetic: '/skriːn/', translation: 'màn hình', level: 3, pos: 'danh từ', example: 'Look at the screen.', exampleTranslation: 'Nhìn vào màn hình.', hint: '🖥️' },
  { id: 'en_576', lang: 'en', term: 'click', phonetic: '/klɪk/', translation: 'click', level: 3, pos: 'động từ', example: 'Click here please.', exampleTranslation: 'Click vào đây.', hint: '🖱️' },
  { id: 'en_577', lang: 'en', term: 'app', phonetic: '/æp/', translation: 'ứng dụng', level: 3, pos: 'danh từ', example: 'A new game app.', exampleTranslation: 'Ứng dụng game mới.', hint: '📲' },

  // ─── Music + entertainment ──────────────────────────────────────────
  { id: 'en_578', lang: 'en', term: 'music', phonetic: '/ˈmjuːzɪk/', translation: 'âm nhạc', level: 3, pos: 'danh từ', example: 'I love music.', exampleTranslation: 'Tôi yêu âm nhạc.', hint: '🎵' },
  { id: 'en_579', lang: 'en', term: 'song', phonetic: '/sɒŋ/', translation: 'bài hát', level: 3, pos: 'danh từ', example: 'I sing a song.', exampleTranslation: 'Tôi hát một bài.', hint: '🎵' },
  { id: 'en_580', lang: 'en', term: 'guitar', phonetic: '/ɡɪˈtɑːr/', translation: 'đàn guitar', level: 3, pos: 'danh từ', example: 'He plays guitar.', exampleTranslation: 'Anh ấy chơi guitar.', hint: '🎸' },
  { id: 'en_581', lang: 'en', term: 'piano', phonetic: '/piˈænoʊ/', translation: 'đàn piano', level: 3, pos: 'danh từ', example: 'She plays piano.', exampleTranslation: 'Cô ấy chơi piano.', hint: '🎹' },
  { id: 'en_582', lang: 'en', term: 'drum', phonetic: '/drʌm/', translation: 'trống', level: 3, pos: 'danh từ', example: 'Loud drum sounds.', exampleTranslation: 'Tiếng trống lớn.', hint: '🥁' },
  { id: 'en_583', lang: 'en', term: 'movie', phonetic: '/ˈmuːvi/', translation: 'phim', level: 3, pos: 'danh từ', example: 'Let\'s watch a movie.', exampleTranslation: 'Xem phim đi.', hint: '🎬' },
  { id: 'en_584', lang: 'en', term: 'film', phonetic: '/fɪlm/', translation: 'phim (Anh)', level: 3, pos: 'danh từ', example: 'A new film is out.', exampleTranslation: 'Phim mới đã ra.', hint: '🎥' },
  { id: 'en_585', lang: 'en', term: 'cinema', phonetic: '/ˈsɪnəmə/', translation: 'rạp chiếu phim', level: 3, pos: 'danh từ', example: 'Go to the cinema.', exampleTranslation: 'Đi rạp phim.', hint: '🎦' },
  { id: 'en_586', lang: 'en', term: 'theater', phonetic: '/ˈθiːətər/', translation: 'nhà hát', level: 3, pos: 'danh từ', example: 'Watch a play at the theater.', exampleTranslation: 'Xem kịch ở nhà hát.', hint: '🎭' },
  { id: 'en_587', lang: 'en', term: 'show', phonetic: '/ʃoʊ/', translation: 'chương trình', level: 3, pos: 'danh từ', example: 'A funny TV show.', exampleTranslation: 'Chương trình tivi vui.', hint: '📺' },
  { id: 'en_588', lang: 'en', term: 'cartoon', phonetic: '/kɑːrˈtuːn/', translation: 'phim hoạt hình', level: 3, pos: 'danh từ', example: 'I watch cartoons.', exampleTranslation: 'Tôi xem hoạt hình.', hint: '📺' },
  { id: 'en_589', lang: 'en', term: 'concert', phonetic: '/ˈkɒnsərt/', translation: 'buổi hòa nhạc', level: 3, pos: 'danh từ', example: 'A concert tonight.', exampleTranslation: 'Hòa nhạc tối nay.', hint: '🎤' },

  // ─── Cooking + recipes ──────────────────────────────────────────────
  { id: 'en_590', lang: 'en', term: 'recipe', phonetic: '/ˈresəpi/', translation: 'công thức', level: 3, pos: 'danh từ', example: 'A new cake recipe.', exampleTranslation: 'Công thức bánh mới.', hint: '📝' },
  { id: 'en_591', lang: 'en', term: 'bake', phonetic: '/beɪk/', translation: 'nướng', level: 3, pos: 'động từ', example: 'I bake cookies.', exampleTranslation: 'Tôi nướng bánh quy.', hint: '🍪' },
  { id: 'en_592', lang: 'en', term: 'fry', phonetic: '/fraɪ/', translation: 'chiên', level: 3, pos: 'động từ', example: 'Fry the eggs.', exampleTranslation: 'Chiên trứng đi.', hint: '🍳' },
  { id: 'en_593', lang: 'en', term: 'boil', phonetic: '/bɔɪl/', translation: 'luộc/đun', level: 3, pos: 'động từ', example: 'Boil the water.', exampleTranslation: 'Đun nước đi.', hint: '🔥' },
  { id: 'en_594', lang: 'en', term: 'taste', phonetic: '/teɪst/', translation: 'nếm', level: 3, pos: 'động từ', example: 'Taste the soup.', exampleTranslation: 'Nếm súp đi.', hint: '👅' },
  { id: 'en_595', lang: 'en', term: 'sweet', phonetic: '/swiːt/', translation: 'ngọt', level: 3, pos: 'tính từ', example: 'The cake is sweet.', exampleTranslation: 'Bánh ngọt.', hint: '🍰' },
  { id: 'en_596', lang: 'en', term: 'sour', phonetic: '/ˈsaʊər/', translation: 'chua', level: 3, pos: 'tính từ', example: 'Lemons are sour.', exampleTranslation: 'Chanh chua.', hint: '🍋' },
  { id: 'en_597', lang: 'en', term: 'spicy', phonetic: '/ˈspaɪsi/', translation: 'cay', level: 3, pos: 'tính từ', example: 'This food is spicy.', exampleTranslation: 'Đồ ăn này cay.', hint: '🌶️' },
  { id: 'en_598', lang: 'en', term: 'bitter', phonetic: '/ˈbɪtər/', translation: 'đắng', level: 3, pos: 'tính từ', example: 'Coffee is bitter.', exampleTranslation: 'Cà phê đắng.', hint: '☕' },
  { id: 'en_599', lang: 'en', term: 'salty', phonetic: '/ˈsɔːlti/', translation: 'mặn', level: 3, pos: 'tính từ', example: 'The chips are salty.', exampleTranslation: 'Bim bim mặn.', hint: '🧂' },
  { id: 'en_600', lang: 'en', term: 'delicious', phonetic: '/dɪˈlɪʃəs/', translation: 'ngon', level: 3, pos: 'tính từ', example: 'This food is delicious.', exampleTranslation: 'Đồ ăn ngon quá.', hint: '😋' },

  // ─── Environment + nature (deeper) ──────────────────────────────────
  { id: 'en_601', lang: 'en', term: 'environment', phonetic: '/ɪnˈvaɪrənmənt/', translation: 'môi trường', level: 3, pos: 'danh từ', example: 'Save the environment.', exampleTranslation: 'Bảo vệ môi trường.', hint: '🌱' },
  { id: 'en_602', lang: 'en', term: 'pollution', phonetic: '/pəˈluːʃən/', translation: 'ô nhiễm', level: 3, pos: 'danh từ', example: 'Pollution is bad.', exampleTranslation: 'Ô nhiễm xấu.', hint: '💨' },
  { id: 'en_603', lang: 'en', term: 'recycle', phonetic: '/riːˈsaɪkəl/', translation: 'tái chế', level: 3, pos: 'động từ', example: 'Recycle paper, please.', exampleTranslation: 'Tái chế giấy đi.', hint: '♻️' },
  { id: 'en_604', lang: 'en', term: 'planet', phonetic: '/ˈplænɪt/', translation: 'hành tinh', level: 3, pos: 'danh từ', example: 'Earth is our planet.', exampleTranslation: 'Trái đất là hành tinh ta.', hint: '🪐' },
  { id: 'en_605', lang: 'en', term: 'earth', phonetic: '/ɜːrθ/', translation: 'trái đất', level: 3, pos: 'danh từ', example: 'The Earth is round.', exampleTranslation: 'Trái đất tròn.', hint: '🌍' },
  { id: 'en_606', lang: 'en', term: 'space', phonetic: '/speɪs/', translation: 'không gian', level: 3, pos: 'danh từ', example: 'Space is vast.', exampleTranslation: 'Không gian rộng lớn.', hint: '🌌' },
  { id: 'en_607', lang: 'en', term: 'rainbow', phonetic: '/ˈreɪnboʊ/', translation: 'cầu vồng', level: 3, pos: 'danh từ', example: 'I see a rainbow.', exampleTranslation: 'Tôi thấy cầu vồng.', hint: '🌈' },
  { id: 'en_608', lang: 'en', term: 'thunder', phonetic: '/ˈθʌndər/', translation: 'sấm', level: 3, pos: 'danh từ', example: 'Loud thunder scares me.', exampleTranslation: 'Sấm to làm tôi sợ.', hint: '⛈️' },
  { id: 'en_609', lang: 'en', term: 'lightning', phonetic: '/ˈlaɪtnɪŋ/', translation: 'tia chớp', level: 3, pos: 'danh từ', example: 'Lightning is bright.', exampleTranslation: 'Tia chớp sáng.', hint: '⚡' },
  { id: 'en_610', lang: 'en', term: 'storm', phonetic: '/stɔːrm/', translation: 'cơn bão', level: 3, pos: 'danh từ', example: 'A big storm came.', exampleTranslation: 'Một cơn bão lớn đến.', hint: '🌪️' },
  { id: 'en_611', lang: 'en', term: 'sunny', phonetic: '/ˈsʌni/', translation: 'nắng', level: 3, pos: 'tính từ', example: 'It\'s sunny today.', exampleTranslation: 'Hôm nay nắng.', hint: '☀️' },
  { id: 'en_612', lang: 'en', term: 'cloudy', phonetic: '/ˈklaʊdi/', translation: 'có mây', level: 3, pos: 'tính từ', example: 'A cloudy day.', exampleTranslation: 'Ngày có mây.', hint: '☁️' },
  { id: 'en_613', lang: 'en', term: 'rainy', phonetic: '/ˈreɪni/', translation: 'có mưa', level: 3, pos: 'tính từ', example: 'A rainy afternoon.', exampleTranslation: 'Buổi chiều có mưa.', hint: '🌧️' },
  { id: 'en_614', lang: 'en', term: 'windy', phonetic: '/ˈwɪndi/', translation: 'có gió', level: 3, pos: 'tính từ', example: 'A windy day.', exampleTranslation: 'Ngày có gió.', hint: '💨' },

  // ─── More verbs (action) ────────────────────────────────────────────
  { id: 'en_615', lang: 'en', term: 'choose', phonetic: '/tʃuːz/', translation: 'chọn', level: 3, pos: 'động từ', example: 'Choose a book.', exampleTranslation: 'Chọn quyển sách.', hint: '👆' },
  { id: 'en_616', lang: 'en', term: 'wait', phonetic: '/weɪt/', translation: 'đợi', level: 3, pos: 'động từ', example: 'Wait a minute.', exampleTranslation: 'Đợi một phút.', hint: '⏳' },
  { id: 'en_617', lang: 'en', term: 'arrive', phonetic: '/əˈraɪv/', translation: 'đến nơi', level: 3, pos: 'động từ', example: 'We arrive at noon.', exampleTranslation: 'Chúng tôi đến lúc trưa.', hint: '🛬' },
  { id: 'en_618', lang: 'en', term: 'leave', phonetic: '/liːv/', translation: 'rời đi', level: 3, pos: 'động từ', example: 'I leave at five.', exampleTranslation: 'Tôi rời đi lúc năm.', hint: '🚪' },
  { id: 'en_619', lang: 'en', term: 'enter', phonetic: '/ˈentər/', translation: 'vào', level: 3, pos: 'động từ', example: 'Enter the room quietly.', exampleTranslation: 'Vào phòng nhẹ nhàng.', hint: '🚪' },
  { id: 'en_620', lang: 'en', term: 'meet', phonetic: '/miːt/', translation: 'gặp', level: 3, pos: 'động từ', example: 'Nice to meet you.', exampleTranslation: 'Rất vui được gặp bạn.', hint: '🤝' },
  { id: 'en_621', lang: 'en', term: 'invite', phonetic: '/ɪnˈvaɪt/', translation: 'mời', level: 3, pos: 'động từ', example: 'I invite my friends.', exampleTranslation: 'Tôi mời bạn bè.', hint: '💌' },
  { id: 'en_622', lang: 'en', term: 'follow', phonetic: '/ˈfɒloʊ/', translation: 'theo', level: 3, pos: 'động từ', example: 'Follow the leader.', exampleTranslation: 'Theo người dẫn đầu.', hint: '👣' },
  { id: 'en_623', lang: 'en', term: 'lead', phonetic: '/liːd/', translation: 'dẫn dắt', level: 3, pos: 'động từ', example: 'Lead the way.', exampleTranslation: 'Dẫn đường đi.', hint: '👨‍💼' },
  { id: 'en_624', lang: 'en', term: 'change', phonetic: '/tʃeɪndʒ/', translation: 'thay đổi', level: 3, pos: 'động từ', example: 'Change your shoes.', exampleTranslation: 'Đổi giày đi.', hint: '🔄' },
  { id: 'en_625', lang: 'en', term: 'try', phonetic: '/traɪ/', translation: 'thử', level: 3, pos: 'động từ', example: 'Try this food.', exampleTranslation: 'Thử món này đi.', hint: '🤔' },
  { id: 'en_626', lang: 'en', term: 'use', phonetic: '/juːz/', translation: 'dùng', level: 3, pos: 'động từ', example: 'Use a pen, please.', exampleTranslation: 'Dùng bút đi.', hint: '🛠️' },
  { id: 'en_627', lang: 'en', term: 'need', phonetic: '/niːd/', translation: 'cần', level: 3, pos: 'động từ', example: 'I need help.', exampleTranslation: 'Tôi cần giúp.', hint: '🙏' },
  { id: 'en_628', lang: 'en', term: 'feel', phonetic: '/fiːl/', translation: 'cảm thấy', level: 3, pos: 'động từ', example: 'I feel happy.', exampleTranslation: 'Tôi cảm thấy vui.', hint: '💭' },
  { id: 'en_629', lang: 'en', term: 'hope', phonetic: '/hoʊp/', translation: 'hy vọng', level: 3, pos: 'động từ', example: 'I hope you win.', exampleTranslation: 'Tôi mong bạn thắng.', hint: '🤞' },
  { id: 'en_630', lang: 'en', term: 'believe', phonetic: '/bɪˈliːv/', translation: 'tin', level: 3, pos: 'động từ', example: 'I believe you.', exampleTranslation: 'Tôi tin bạn.', hint: '💖' },
  { id: 'en_631', lang: 'en', term: 'understand', phonetic: '/ˌʌndərˈstænd/', translation: 'hiểu', level: 3, pos: 'động từ', example: 'I understand now.', exampleTranslation: 'Tôi hiểu rồi.', hint: '💡' },
  { id: 'en_632', lang: 'en', term: 'agree', phonetic: '/əˈɡriː/', translation: 'đồng ý', level: 3, pos: 'động từ', example: 'I agree with you.', exampleTranslation: 'Tôi đồng ý với bạn.', hint: '👍' },

  // ─── Closing closers + conjunctions ─────────────────────────────────
  { id: 'en_633', lang: 'en', term: 'maybe', phonetic: '/ˈmeɪbi/', translation: 'có thể', level: 3, pos: 'trạng từ', example: 'Maybe tomorrow.', exampleTranslation: 'Có thể ngày mai.', hint: '🤷' },
  { id: 'en_634', lang: 'en', term: 'really', phonetic: '/ˈrɪəli/', translation: 'thực sự', level: 3, pos: 'trạng từ', example: 'I really like it.', exampleTranslation: 'Tôi thực sự thích.', hint: '💯' },
  { id: 'en_635', lang: 'en', term: 'still', phonetic: '/stɪl/', translation: 'vẫn', level: 3, pos: 'trạng từ', example: 'I still love it.', exampleTranslation: 'Tôi vẫn yêu nó.', hint: '⏸️' },
  { id: 'en_636', lang: 'en', term: 'almost', phonetic: '/ˈɔːlmoʊst/', translation: 'gần như', level: 3, pos: 'trạng từ', example: 'Almost done!', exampleTranslation: 'Gần xong rồi!', hint: '⏳' },
  { id: 'en_637', lang: 'en', term: 'enough', phonetic: '/ɪˈnʌf/', translation: 'đủ', level: 3, pos: 'tính từ', example: 'I have enough food.', exampleTranslation: 'Tôi có đủ đồ ăn.', hint: '✋' },
  { id: 'en_638', lang: 'en', term: 'few', phonetic: '/fjuː/', translation: 'một ít', level: 3, pos: 'tính từ', example: 'A few books.', exampleTranslation: 'Vài quyển sách.', hint: '📊' },
  { id: 'en_639', lang: 'en', term: 'lot', phonetic: '/lɒt/', translation: 'rất nhiều', level: 3, pos: 'danh từ', example: 'A lot of friends.', exampleTranslation: 'Rất nhiều bạn.', hint: '➕' },
  { id: 'en_640', lang: 'en', term: 'million', phonetic: '/ˈmɪljən/', translation: 'một triệu', level: 3, pos: 'số đếm', example: 'A million stars.', exampleTranslation: 'Một triệu ngôi sao.', hint: '⭐' },
];
