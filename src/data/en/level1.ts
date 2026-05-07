import type { Word } from '../../types';

/**
 * Level 1 — Cambridge Starters-equivalent vocabulary.
 *
 * Target audience: trẻ em 6-8 tuổi, học sinh lớp 1-2, beginner English learners.
 * Source basis: Cambridge YLE Starters official word list (~280 words),
 * filtered for kid-friendly themes and reinforced with Oxford 3000 A1 picks.
 *
 * Design principles:
 *   - **Concrete over abstract**: prefer "apple" over "concept", "dog" over
 *     "behavior". Children at this level need things they can point to.
 *   - **Simple example sentences (≤6 words)**: parents reading aloud to
 *     5-year-olds shouldn't trip on grammar. Use present simple, common
 *     subject pronouns, no complex tenses.
 *   - **Vietnamese translations match school textbooks**: avoid literary
 *     synonyms; use the word a Vietnamese 1st-grader actually says.
 *   - **Emoji hints help non-readers**: each word has a visual cue so a
 *     child who can't yet read Vietnamese still gets context.
 *
 * Themes (matches Cambridge YLE Starters topic groups):
 *   - Pronouns + greetings
 *   - Family + people
 *   - Numbers (1-20)
 *   - Colors (basic)
 *   - Body parts
 *   - Animals (pets + farm + zoo)
 *   - Food + drink
 *   - School + classroom
 *   - Clothes
 *   - Home + furniture
 *   - Toys + games
 *   - Sports + activities
 *   - Weather + nature
 *   - Question words + basic verbs
 *
 * Why "Starters" naming in code only:
 *   The user-facing label is "Cấp 1 — Cơ bản" (see tiers.ts) to avoid
 *   Cambridge trademark issues for Chrome Web Store submission. Internal
 *   file naming follows Cambridge YLE conventions for dev clarity.
 */
export const enLevel1: Word[] = [
  // ─── Pronouns ───────────────────────────────────────────────────────
  { id: 'en_001', lang: 'en', term: 'I', phonetic: '/aɪ/', translation: 'tôi', level: 1, pos: 'đại từ', example: 'I am happy.', exampleTranslation: 'Tôi vui.', hint: '👤' },
  { id: 'en_002', lang: 'en', term: 'you', phonetic: '/juː/', translation: 'bạn', level: 1, pos: 'đại từ', example: 'You are nice.', exampleTranslation: 'Bạn dễ thương.', hint: '👉' },
  { id: 'en_003', lang: 'en', term: 'he', phonetic: '/hiː/', translation: 'anh ấy', level: 1, pos: 'đại từ', example: 'He is my brother.', exampleTranslation: 'Anh ấy là anh tôi.', hint: '👨' },
  { id: 'en_004', lang: 'en', term: 'she', phonetic: '/ʃiː/', translation: 'cô ấy', level: 1, pos: 'đại từ', example: 'She is my sister.', exampleTranslation: 'Cô ấy là chị tôi.', hint: '👩' },
  { id: 'en_005', lang: 'en', term: 'it', phonetic: '/ɪt/', translation: 'nó (vật)', level: 1, pos: 'đại từ', example: 'It is a cat.', exampleTranslation: 'Nó là một con mèo.', hint: '👇' },
  { id: 'en_006', lang: 'en', term: 'we', phonetic: '/wiː/', translation: 'chúng ta', level: 1, pos: 'đại từ', example: 'We are friends.', exampleTranslation: 'Chúng ta là bạn.', hint: '👥' },
  { id: 'en_007', lang: 'en', term: 'they', phonetic: '/ðeɪ/', translation: 'họ', level: 1, pos: 'đại từ', example: 'They are kids.', exampleTranslation: 'Họ là trẻ em.', hint: '👬' },
  { id: 'en_008', lang: 'en', term: 'my', phonetic: '/maɪ/', translation: 'của tôi', level: 1, pos: 'đại từ sở hữu', example: 'My name is Tom.', exampleTranslation: 'Tên tôi là Tom.', hint: '🙋' },
  { id: 'en_009', lang: 'en', term: 'your', phonetic: '/jɔːr/', translation: 'của bạn', level: 1, pos: 'đại từ sở hữu', example: 'Your bag is red.', exampleTranslation: 'Cặp của bạn màu đỏ.', hint: '👋' },
  { id: 'en_010', lang: 'en', term: 'this', phonetic: '/ðɪs/', translation: 'cái này', level: 1, pos: 'đại từ chỉ định', example: 'This is a pen.', exampleTranslation: 'Đây là cây bút.', hint: '☝️' },
  { id: 'en_011', lang: 'en', term: 'that', phonetic: '/ðæt/', translation: 'cái đó', level: 1, pos: 'đại từ chỉ định', example: 'That is a book.', exampleTranslation: 'Đó là quyển sách.', hint: '👆' },
  { id: 'en_012', lang: 'en', term: 'these', phonetic: '/ðiːz/', translation: 'những cái này', level: 1, pos: 'đại từ chỉ định', example: 'These are toys.', exampleTranslation: 'Những cái này là đồ chơi.', hint: '🤲' },
  { id: 'en_013', lang: 'en', term: 'those', phonetic: '/ðoʊz/', translation: 'những cái đó', level: 1, pos: 'đại từ chỉ định', example: 'Those are birds.', exampleTranslation: 'Những con đó là chim.', hint: '👀' },

  // ─── Greetings ──────────────────────────────────────────────────────
  { id: 'en_014', lang: 'en', term: 'hello', phonetic: '/həˈloʊ/', translation: 'xin chào', level: 1, pos: 'thán từ', example: 'Hello, my friend.', exampleTranslation: 'Xin chào, bạn của tôi.', hint: '👋' },
  { id: 'en_015', lang: 'en', term: 'hi', phonetic: '/haɪ/', translation: 'chào', level: 1, pos: 'thán từ', example: 'Hi, Tom!', exampleTranslation: 'Chào Tom!', hint: '🙋' },
  { id: 'en_016', lang: 'en', term: 'goodbye', phonetic: '/ɡʊdˈbaɪ/', translation: 'tạm biệt', level: 1, pos: 'thán từ', example: 'Goodbye, see you later.', exampleTranslation: 'Tạm biệt, hẹn gặp lại.', hint: '👋' },
  { id: 'en_017', lang: 'en', term: 'bye', phonetic: '/baɪ/', translation: 'tạm biệt', level: 1, pos: 'thán từ', example: 'Bye, mom!', exampleTranslation: 'Tạm biệt mẹ!', hint: '👋' },
  { id: 'en_018', lang: 'en', term: 'please', phonetic: '/pliːz/', translation: 'làm ơn', level: 1, pos: 'thán từ', example: 'Help me, please.', exampleTranslation: 'Làm ơn giúp tôi.', hint: '🙏' },
  { id: 'en_019', lang: 'en', term: 'thanks', phonetic: '/θæŋks/', translation: 'cảm ơn', level: 1, pos: 'thán từ', example: 'Thanks a lot!', exampleTranslation: 'Cảm ơn rất nhiều!', hint: '🙏' },
  { id: 'en_020', lang: 'en', term: 'sorry', phonetic: '/ˈsɒri/', translation: 'xin lỗi', level: 1, pos: 'tính từ', example: 'I am sorry.', exampleTranslation: 'Tôi xin lỗi.', hint: '😔' },
  { id: 'en_021', lang: 'en', term: 'yes', phonetic: '/jes/', translation: 'vâng', level: 1, pos: 'thán từ', example: 'Yes, I can.', exampleTranslation: 'Vâng, tôi có thể.', hint: '✅' },
  { id: 'en_022', lang: 'en', term: 'no', phonetic: '/noʊ/', translation: 'không', level: 1, pos: 'thán từ', example: 'No, thank you.', exampleTranslation: 'Không, cảm ơn.', hint: '❌' },
  { id: 'en_023', lang: 'en', term: 'okay', phonetic: '/ˌoʊˈkeɪ/', translation: 'được rồi', level: 1, pos: 'thán từ', example: 'Okay, let\'s go.', exampleTranslation: 'Được rồi, đi thôi.', hint: '👌' },

  // ─── Family ─────────────────────────────────────────────────────────
  { id: 'en_024', lang: 'en', term: 'mother', phonetic: '/ˈmʌðər/', translation: 'mẹ', level: 1, pos: 'danh từ', example: 'I love my mother.', exampleTranslation: 'Tôi yêu mẹ tôi.', hint: '👩' },
  { id: 'en_025', lang: 'en', term: 'father', phonetic: '/ˈfɑːðər/', translation: 'bố', level: 1, pos: 'danh từ', example: 'My father is tall.', exampleTranslation: 'Bố tôi cao.', hint: '👨' },
  { id: 'en_026', lang: 'en', term: 'mom', phonetic: '/mɒm/', translation: 'mẹ (thân mật)', level: 1, pos: 'danh từ', example: 'Hi, mom!', exampleTranslation: 'Chào mẹ!', hint: '👩' },
  { id: 'en_027', lang: 'en', term: 'dad', phonetic: '/dæd/', translation: 'bố (thân mật)', level: 1, pos: 'danh từ', example: 'Dad is at work.', exampleTranslation: 'Bố đang đi làm.', hint: '👨' },
  { id: 'en_028', lang: 'en', term: 'brother', phonetic: '/ˈbrʌðər/', translation: 'anh/em trai', level: 1, pos: 'danh từ', example: 'My brother is six.', exampleTranslation: 'Em trai tôi sáu tuổi.', hint: '👦' },
  { id: 'en_029', lang: 'en', term: 'sister', phonetic: '/ˈsɪstər/', translation: 'chị/em gái', level: 1, pos: 'danh từ', example: 'I have one sister.', exampleTranslation: 'Tôi có một chị gái.', hint: '👧' },
  { id: 'en_030', lang: 'en', term: 'baby', phonetic: '/ˈbeɪbi/', translation: 'em bé', level: 1, pos: 'danh từ', example: 'The baby is cute.', exampleTranslation: 'Em bé dễ thương.', hint: '👶' },
  { id: 'en_031', lang: 'en', term: 'grandma', phonetic: '/ˈɡrænmɑː/', translation: 'bà', level: 1, pos: 'danh từ', example: 'Grandma is kind.', exampleTranslation: 'Bà tốt bụng.', hint: '👵' },
  { id: 'en_032', lang: 'en', term: 'grandpa', phonetic: '/ˈɡrænpɑː/', translation: 'ông', level: 1, pos: 'danh từ', example: 'Grandpa tells stories.', exampleTranslation: 'Ông kể chuyện.', hint: '👴' },
  { id: 'en_033', lang: 'en', term: 'family', phonetic: '/ˈfæməli/', translation: 'gia đình', level: 1, pos: 'danh từ', example: 'My family is big.', exampleTranslation: 'Gia đình tôi đông.', hint: '👨\u200d👩\u200d👧\u200d👦' },
  { id: 'en_034', lang: 'en', term: 'friend', phonetic: '/frend/', translation: 'bạn', level: 1, pos: 'danh từ', example: 'She is my friend.', exampleTranslation: 'Cô ấy là bạn tôi.', hint: '👯' },
  { id: 'en_035', lang: 'en', term: 'boy', phonetic: '/bɔɪ/', translation: 'con trai', level: 1, pos: 'danh từ', example: 'The boy is happy.', exampleTranslation: 'Cậu bé vui.', hint: '👦' },
  { id: 'en_036', lang: 'en', term: 'girl', phonetic: '/ɡɜːrl/', translation: 'con gái', level: 1, pos: 'danh từ', example: 'The girl can sing.', exampleTranslation: 'Cô bé biết hát.', hint: '👧' },
  { id: 'en_037', lang: 'en', term: 'man', phonetic: '/mæn/', translation: 'người đàn ông', level: 1, pos: 'danh từ', example: 'The man is old.', exampleTranslation: 'Người đàn ông già.', hint: '👨' },
  { id: 'en_038', lang: 'en', term: 'woman', phonetic: '/ˈwʊmən/', translation: 'người phụ nữ', level: 1, pos: 'danh từ', example: 'The woman is nice.', exampleTranslation: 'Người phụ nữ dễ thương.', hint: '👩' },
  { id: 'en_039', lang: 'en', term: 'people', phonetic: '/ˈpiːpəl/', translation: 'mọi người', level: 1, pos: 'danh từ', example: 'Many people are here.', exampleTranslation: 'Nhiều người ở đây.', hint: '👥' },
  { id: 'en_040', lang: 'en', term: 'name', phonetic: '/neɪm/', translation: 'tên', level: 1, pos: 'danh từ', example: 'My name is Lan.', exampleTranslation: 'Tên tôi là Lan.', hint: '🪪' },

  // ─── Numbers (1-20) ─────────────────────────────────────────────────
  { id: 'en_041', lang: 'en', term: 'one', phonetic: '/wʌn/', translation: 'một', level: 1, pos: 'số đếm', example: 'I have one cat.', exampleTranslation: 'Tôi có một con mèo.', hint: '1️⃣' },
  { id: 'en_042', lang: 'en', term: 'two', phonetic: '/tuː/', translation: 'hai', level: 1, pos: 'số đếm', example: 'Two birds fly.', exampleTranslation: 'Hai con chim bay.', hint: '2️⃣' },
  { id: 'en_043', lang: 'en', term: 'three', phonetic: '/θriː/', translation: 'ba', level: 1, pos: 'số đếm', example: 'I see three dogs.', exampleTranslation: 'Tôi thấy ba con chó.', hint: '3️⃣' },
  { id: 'en_044', lang: 'en', term: 'four', phonetic: '/fɔːr/', translation: 'bốn', level: 1, pos: 'số đếm', example: 'Four apples are red.', exampleTranslation: 'Bốn quả táo màu đỏ.', hint: '4️⃣' },
  { id: 'en_045', lang: 'en', term: 'five', phonetic: '/faɪv/', translation: 'năm', level: 1, pos: 'số đếm', example: 'I am five years old.', exampleTranslation: 'Tôi năm tuổi.', hint: '5️⃣' },
  { id: 'en_046', lang: 'en', term: 'six', phonetic: '/sɪks/', translation: 'sáu', level: 1, pos: 'số đếm', example: 'Six fish swim.', exampleTranslation: 'Sáu con cá bơi.', hint: '6️⃣' },
  { id: 'en_047', lang: 'en', term: 'seven', phonetic: '/ˈsevən/', translation: 'bảy', level: 1, pos: 'số đếm', example: 'Seven days a week.', exampleTranslation: 'Bảy ngày một tuần.', hint: '7️⃣' },
  { id: 'en_048', lang: 'en', term: 'eight', phonetic: '/eɪt/', translation: 'tám', level: 1, pos: 'số đếm', example: 'Eight cats play.', exampleTranslation: 'Tám con mèo chơi.', hint: '8️⃣' },
  { id: 'en_049', lang: 'en', term: 'nine', phonetic: '/naɪn/', translation: 'chín', level: 1, pos: 'số đếm', example: 'I have nine pencils.', exampleTranslation: 'Tôi có chín cây bút chì.', hint: '9️⃣' },
  { id: 'en_050', lang: 'en', term: 'ten', phonetic: '/ten/', translation: 'mười', level: 1, pos: 'số đếm', example: 'Ten kids are here.', exampleTranslation: 'Mười em bé ở đây.', hint: '🔟' },
  { id: 'en_051', lang: 'en', term: 'eleven', phonetic: '/ɪˈlevən/', translation: 'mười một', level: 1, pos: 'số đếm', example: 'She is eleven.', exampleTranslation: 'Cô ấy mười một tuổi.', hint: '1️⃣1️⃣' },
  { id: 'en_052', lang: 'en', term: 'twelve', phonetic: '/twelv/', translation: 'mười hai', level: 1, pos: 'số đếm', example: 'Twelve months a year.', exampleTranslation: 'Mười hai tháng một năm.', hint: '1️⃣2️⃣' },
  { id: 'en_053', lang: 'en', term: 'thirteen', phonetic: '/ˌθɜːrˈtiːn/', translation: 'mười ba', level: 1, pos: 'số đếm', example: 'My brother is thirteen.', exampleTranslation: 'Anh tôi mười ba tuổi.', hint: '1️⃣3️⃣' },
  { id: 'en_054', lang: 'en', term: 'fourteen', phonetic: '/ˌfɔːrˈtiːn/', translation: 'mười bốn', level: 1, pos: 'số đếm', example: 'Fourteen flowers bloom.', exampleTranslation: 'Mười bốn bông hoa nở.', hint: '1️⃣4️⃣' },
  { id: 'en_055', lang: 'en', term: 'fifteen', phonetic: '/ˌfɪfˈtiːn/', translation: 'mười lăm', level: 1, pos: 'số đếm', example: 'Fifteen birds sing.', exampleTranslation: 'Mười lăm con chim hót.', hint: '1️⃣5️⃣' },
  { id: 'en_056', lang: 'en', term: 'twenty', phonetic: '/ˈtwenti/', translation: 'hai mươi', level: 1, pos: 'số đếm', example: 'I have twenty books.', exampleTranslation: 'Tôi có hai mươi quyển sách.', hint: '2️⃣0️⃣' },
  { id: 'en_057', lang: 'en', term: 'zero', phonetic: '/ˈzɪroʊ/', translation: 'không', level: 1, pos: 'số đếm', example: 'Score is zero.', exampleTranslation: 'Tỉ số là không.', hint: '0️⃣' },

  // ─── Colors ─────────────────────────────────────────────────────────
  { id: 'en_058', lang: 'en', term: 'red', phonetic: '/red/', translation: 'màu đỏ', level: 1, pos: 'tính từ', example: 'The apple is red.', exampleTranslation: 'Quả táo màu đỏ.', hint: '🔴' },
  { id: 'en_059', lang: 'en', term: 'blue', phonetic: '/bluː/', translation: 'màu xanh dương', level: 1, pos: 'tính từ', example: 'The sky is blue.', exampleTranslation: 'Bầu trời màu xanh.', hint: '🔵' },
  { id: 'en_060', lang: 'en', term: 'green', phonetic: '/ɡriːn/', translation: 'màu xanh lá', level: 1, pos: 'tính từ', example: 'Grass is green.', exampleTranslation: 'Cỏ màu xanh lá.', hint: '🟢' },
  { id: 'en_061', lang: 'en', term: 'yellow', phonetic: '/ˈjeloʊ/', translation: 'màu vàng', level: 1, pos: 'tính từ', example: 'The sun is yellow.', exampleTranslation: 'Mặt trời màu vàng.', hint: '🟡' },
  { id: 'en_062', lang: 'en', term: 'black', phonetic: '/blæk/', translation: 'màu đen', level: 1, pos: 'tính từ', example: 'My cat is black.', exampleTranslation: 'Mèo của tôi màu đen.', hint: '⚫' },
  { id: 'en_063', lang: 'en', term: 'white', phonetic: '/waɪt/', translation: 'màu trắng', level: 1, pos: 'tính từ', example: 'Snow is white.', exampleTranslation: 'Tuyết màu trắng.', hint: '⚪' },
  { id: 'en_064', lang: 'en', term: 'orange', phonetic: '/ˈɔːrɪndʒ/', translation: 'màu cam', level: 1, pos: 'tính từ', example: 'The carrot is orange.', exampleTranslation: 'Củ cà rốt màu cam.', hint: '🟠' },
  { id: 'en_065', lang: 'en', term: 'pink', phonetic: '/pɪŋk/', translation: 'màu hồng', level: 1, pos: 'tính từ', example: 'Her dress is pink.', exampleTranslation: 'Váy cô ấy màu hồng.', hint: '🌸' },
  { id: 'en_066', lang: 'en', term: 'purple', phonetic: '/ˈpɜːrpəl/', translation: 'màu tím', level: 1, pos: 'tính từ', example: 'The grape is purple.', exampleTranslation: 'Quả nho màu tím.', hint: '🟣' },
  { id: 'en_067', lang: 'en', term: 'brown', phonetic: '/braʊn/', translation: 'màu nâu', level: 1, pos: 'tính từ', example: 'The bear is brown.', exampleTranslation: 'Con gấu màu nâu.', hint: '🟤' },
  { id: 'en_068', lang: 'en', term: 'gray', phonetic: '/ɡreɪ/', translation: 'màu xám', level: 1, pos: 'tính từ', example: 'The mouse is gray.', exampleTranslation: 'Con chuột màu xám.', hint: '⬜' },
  { id: 'en_069', lang: 'en', term: 'color', phonetic: '/ˈkʌlər/', translation: 'màu sắc', level: 1, pos: 'danh từ', example: 'What color is it?', exampleTranslation: 'Nó màu gì?', hint: '🎨' },

  // ─── Body parts ─────────────────────────────────────────────────────
  { id: 'en_070', lang: 'en', term: 'head', phonetic: '/hed/', translation: 'đầu', level: 1, pos: 'danh từ', example: 'My head hurts.', exampleTranslation: 'Đầu tôi đau.', hint: '👤' },
  { id: 'en_071', lang: 'en', term: 'face', phonetic: '/feɪs/', translation: 'mặt', level: 1, pos: 'danh từ', example: 'Wash your face.', exampleTranslation: 'Rửa mặt đi.', hint: '😊' },
  { id: 'en_072', lang: 'en', term: 'eye', phonetic: '/aɪ/', translation: 'mắt', level: 1, pos: 'danh từ', example: 'I have two eyes.', exampleTranslation: 'Tôi có hai mắt.', hint: '👁️' },
  { id: 'en_073', lang: 'en', term: 'nose', phonetic: '/noʊz/', translation: 'mũi', level: 1, pos: 'danh từ', example: 'My nose is small.', exampleTranslation: 'Mũi tôi nhỏ.', hint: '👃' },
  { id: 'en_074', lang: 'en', term: 'mouth', phonetic: '/maʊθ/', translation: 'miệng', level: 1, pos: 'danh từ', example: 'Open your mouth.', exampleTranslation: 'Há miệng ra.', hint: '👄' },
  { id: 'en_075', lang: 'en', term: 'ear', phonetic: '/ɪr/', translation: 'tai', level: 1, pos: 'danh từ', example: 'I hear with my ears.', exampleTranslation: 'Tôi nghe bằng tai.', hint: '👂' },
  { id: 'en_076', lang: 'en', term: 'hair', phonetic: '/her/', translation: 'tóc', level: 1, pos: 'danh từ', example: 'Her hair is long.', exampleTranslation: 'Tóc cô ấy dài.', hint: '💇' },
  { id: 'en_077', lang: 'en', term: 'hand', phonetic: '/hænd/', translation: 'bàn tay', level: 1, pos: 'danh từ', example: 'Wash your hands.', exampleTranslation: 'Rửa tay đi.', hint: '✋' },
  { id: 'en_078', lang: 'en', term: 'foot', phonetic: '/fʊt/', translation: 'bàn chân', level: 1, pos: 'danh từ', example: 'My foot is small.', exampleTranslation: 'Chân tôi nhỏ.', hint: '🦶' },
  { id: 'en_079', lang: 'en', term: 'leg', phonetic: '/leɡ/', translation: 'chân', level: 1, pos: 'danh từ', example: 'I run with my legs.', exampleTranslation: 'Tôi chạy bằng chân.', hint: '🦵' },
  { id: 'en_080', lang: 'en', term: 'arm', phonetic: '/ɑːrm/', translation: 'cánh tay', level: 1, pos: 'danh từ', example: 'I have two arms.', exampleTranslation: 'Tôi có hai cánh tay.', hint: '💪' },
  { id: 'en_081', lang: 'en', term: 'body', phonetic: '/ˈbɒdi/', translation: 'cơ thể', level: 1, pos: 'danh từ', example: 'My body is strong.', exampleTranslation: 'Cơ thể tôi khỏe.', hint: '🧍' },
  { id: 'en_082', lang: 'en', term: 'tooth', phonetic: '/tuːθ/', translation: 'răng', level: 1, pos: 'danh từ', example: 'Brush your tooth.', exampleTranslation: 'Đánh răng đi.', hint: '🦷' },

  // ─── Animals ────────────────────────────────────────────────────────
  { id: 'en_083', lang: 'en', term: 'dog', phonetic: '/dɒɡ/', translation: 'con chó', level: 1, pos: 'danh từ', example: 'My dog is brown.', exampleTranslation: 'Chó của tôi màu nâu.', hint: '🐕' },
  { id: 'en_084', lang: 'en', term: 'cat', phonetic: '/kæt/', translation: 'con mèo', level: 1, pos: 'danh từ', example: 'The cat is sleeping.', exampleTranslation: 'Con mèo đang ngủ.', hint: '🐈' },
  { id: 'en_085', lang: 'en', term: 'bird', phonetic: '/bɜːrd/', translation: 'con chim', level: 1, pos: 'danh từ', example: 'The bird can fly.', exampleTranslation: 'Con chim biết bay.', hint: '🐦' },
  { id: 'en_086', lang: 'en', term: 'fish', phonetic: '/fɪʃ/', translation: 'con cá', level: 1, pos: 'danh từ', example: 'The fish swims.', exampleTranslation: 'Con cá bơi.', hint: '🐟' },
  { id: 'en_087', lang: 'en', term: 'rabbit', phonetic: '/ˈræbɪt/', translation: 'con thỏ', level: 1, pos: 'danh từ', example: 'The rabbit is white.', exampleTranslation: 'Con thỏ màu trắng.', hint: '🐰' },
  { id: 'en_088', lang: 'en', term: 'horse', phonetic: '/hɔːrs/', translation: 'con ngựa', level: 1, pos: 'danh từ', example: 'I ride a horse.', exampleTranslation: 'Tôi cưỡi ngựa.', hint: '🐴' },
  { id: 'en_089', lang: 'en', term: 'cow', phonetic: '/kaʊ/', translation: 'con bò', level: 1, pos: 'danh từ', example: 'The cow gives milk.', exampleTranslation: 'Con bò cho sữa.', hint: '🐄' },
  { id: 'en_090', lang: 'en', term: 'pig', phonetic: '/pɪɡ/', translation: 'con heo', level: 1, pos: 'danh từ', example: 'The pig is pink.', exampleTranslation: 'Con heo màu hồng.', hint: '🐖' },
  { id: 'en_091', lang: 'en', term: 'duck', phonetic: '/dʌk/', translation: 'con vịt', level: 1, pos: 'danh từ', example: 'The duck swims.', exampleTranslation: 'Con vịt bơi.', hint: '🦆' },
  { id: 'en_092', lang: 'en', term: 'chicken', phonetic: '/ˈtʃɪkɪn/', translation: 'con gà', level: 1, pos: 'danh từ', example: 'The chicken eats corn.', exampleTranslation: 'Con gà ăn ngô.', hint: '🐔' },
  { id: 'en_093', lang: 'en', term: 'lion', phonetic: '/ˈlaɪən/', translation: 'sư tử', level: 1, pos: 'danh từ', example: 'The lion is big.', exampleTranslation: 'Sư tử to lớn.', hint: '🦁' },
  { id: 'en_094', lang: 'en', term: 'tiger', phonetic: '/ˈtaɪɡər/', translation: 'con hổ', level: 1, pos: 'danh từ', example: 'The tiger has stripes.', exampleTranslation: 'Con hổ có sọc.', hint: '🐯' },
  { id: 'en_095', lang: 'en', term: 'elephant', phonetic: '/ˈeləfənt/', translation: 'con voi', level: 1, pos: 'danh từ', example: 'The elephant is huge.', exampleTranslation: 'Con voi rất to.', hint: '🐘' },
  { id: 'en_096', lang: 'en', term: 'monkey', phonetic: '/ˈmʌŋki/', translation: 'con khỉ', level: 1, pos: 'danh từ', example: 'The monkey climbs trees.', exampleTranslation: 'Con khỉ leo cây.', hint: '🐒' },
  { id: 'en_097', lang: 'en', term: 'bear', phonetic: '/ber/', translation: 'con gấu', level: 1, pos: 'danh từ', example: 'The bear is sleeping.', exampleTranslation: 'Con gấu đang ngủ.', hint: '🐻' },
  { id: 'en_098', lang: 'en', term: 'frog', phonetic: '/frɒɡ/', translation: 'con ếch', level: 1, pos: 'danh từ', example: 'The frog jumps.', exampleTranslation: 'Con ếch nhảy.', hint: '🐸' },
  { id: 'en_099', lang: 'en', term: 'mouse', phonetic: '/maʊs/', translation: 'con chuột', level: 1, pos: 'danh từ', example: 'The mouse is small.', exampleTranslation: 'Con chuột nhỏ.', hint: '🐭' },
  { id: 'en_100', lang: 'en', term: 'animal', phonetic: '/ˈænɪməl/', translation: 'động vật', level: 1, pos: 'danh từ', example: 'I love animals.', exampleTranslation: 'Tôi yêu động vật.', hint: '🐾' },

  // ─── Food & drink ───────────────────────────────────────────────────
  { id: 'en_101', lang: 'en', term: 'apple', phonetic: '/ˈæpəl/', translation: 'quả táo', level: 1, pos: 'danh từ', example: 'I eat an apple.', exampleTranslation: 'Tôi ăn một quả táo.', hint: '🍎' },
  { id: 'en_102', lang: 'en', term: 'banana', phonetic: '/bəˈnænə/', translation: 'quả chuối', level: 1, pos: 'danh từ', example: 'The banana is yellow.', exampleTranslation: 'Quả chuối màu vàng.', hint: '🍌' },
  { id: 'en_103', lang: 'en', term: 'orange', phonetic: '/ˈɔːrɪndʒ/', translation: 'quả cam', level: 1, pos: 'danh từ', example: 'I like orange juice.', exampleTranslation: 'Tôi thích nước cam.', hint: '🍊' },
  { id: 'en_104', lang: 'en', term: 'bread', phonetic: '/bred/', translation: 'bánh mì', level: 1, pos: 'danh từ', example: 'I eat bread for breakfast.', exampleTranslation: 'Tôi ăn bánh mì sáng.', hint: '🍞' },
  { id: 'en_105', lang: 'en', term: 'rice', phonetic: '/raɪs/', translation: 'cơm', level: 1, pos: 'danh từ', example: 'We eat rice every day.', exampleTranslation: 'Chúng tôi ăn cơm mỗi ngày.', hint: '🍚' },
  { id: 'en_106', lang: 'en', term: 'milk', phonetic: '/mɪlk/', translation: 'sữa', level: 1, pos: 'danh từ', example: 'I drink milk.', exampleTranslation: 'Tôi uống sữa.', hint: '🥛' },
  { id: 'en_107', lang: 'en', term: 'water', phonetic: '/ˈwɔːtər/', translation: 'nước', level: 1, pos: 'danh từ', example: 'I want water.', exampleTranslation: 'Tôi muốn uống nước.', hint: '💧' },
  { id: 'en_108', lang: 'en', term: 'juice', phonetic: '/dʒuːs/', translation: 'nước ép', level: 1, pos: 'danh từ', example: 'Apple juice is sweet.', exampleTranslation: 'Nước ép táo ngọt.', hint: '🧃' },
  { id: 'en_109', lang: 'en', term: 'tea', phonetic: '/tiː/', translation: 'trà', level: 1, pos: 'danh từ', example: 'Mom drinks tea.', exampleTranslation: 'Mẹ uống trà.', hint: '🍵' },
  { id: 'en_110', lang: 'en', term: 'cake', phonetic: '/keɪk/', translation: 'bánh ngọt', level: 1, pos: 'danh từ', example: 'I love birthday cake.', exampleTranslation: 'Tôi yêu bánh sinh nhật.', hint: '🎂' },
  { id: 'en_111', lang: 'en', term: 'egg', phonetic: '/eɡ/', translation: 'trứng', level: 1, pos: 'danh từ', example: 'I eat one egg.', exampleTranslation: 'Tôi ăn một quả trứng.', hint: '🥚' },
  { id: 'en_112', lang: 'en', term: 'fish', phonetic: '/fɪʃ/', translation: 'cá (món ăn)', level: 1, pos: 'danh từ', example: 'Fish is healthy.', exampleTranslation: 'Cá tốt cho sức khỏe.', hint: '🐟' },
  { id: 'en_113', lang: 'en', term: 'meat', phonetic: '/miːt/', translation: 'thịt', level: 1, pos: 'danh từ', example: 'I eat meat.', exampleTranslation: 'Tôi ăn thịt.', hint: '🥩' },
  { id: 'en_114', lang: 'en', term: 'sugar', phonetic: '/ˈʃʊɡər/', translation: 'đường', level: 1, pos: 'danh từ', example: 'Sugar is sweet.', exampleTranslation: 'Đường ngọt.', hint: '🍬' },
  { id: 'en_115', lang: 'en', term: 'salt', phonetic: '/sɔːlt/', translation: 'muối', level: 1, pos: 'danh từ', example: 'Add some salt.', exampleTranslation: 'Thêm chút muối.', hint: '🧂' },
  { id: 'en_116', lang: 'en', term: 'food', phonetic: '/fuːd/', translation: 'thức ăn', level: 1, pos: 'danh từ', example: 'I love food.', exampleTranslation: 'Tôi yêu thức ăn.', hint: '🍽️' },

  // ─── School ─────────────────────────────────────────────────────────
  { id: 'en_117', lang: 'en', term: 'school', phonetic: '/skuːl/', translation: 'trường học', level: 1, pos: 'danh từ', example: 'I go to school.', exampleTranslation: 'Tôi đi học.', hint: '🏫' },
  { id: 'en_118', lang: 'en', term: 'book', phonetic: '/bʊk/', translation: 'quyển sách', level: 1, pos: 'danh từ', example: 'This book is fun.', exampleTranslation: 'Quyển sách này vui.', hint: '📚' },
  { id: 'en_119', lang: 'en', term: 'pen', phonetic: '/pen/', translation: 'cây bút', level: 1, pos: 'danh từ', example: 'I write with a pen.', exampleTranslation: 'Tôi viết bằng bút.', hint: '🖊️' },
  { id: 'en_120', lang: 'en', term: 'pencil', phonetic: '/ˈpensəl/', translation: 'bút chì', level: 1, pos: 'danh từ', example: 'The pencil is short.', exampleTranslation: 'Cây bút chì ngắn.', hint: '✏️' },
  { id: 'en_121', lang: 'en', term: 'bag', phonetic: '/bæɡ/', translation: 'cặp/túi', level: 1, pos: 'danh từ', example: 'My bag is full.', exampleTranslation: 'Cặp tôi đầy.', hint: '🎒' },
  { id: 'en_122', lang: 'en', term: 'desk', phonetic: '/desk/', translation: 'bàn học', level: 1, pos: 'danh từ', example: 'I sit at my desk.', exampleTranslation: 'Tôi ngồi ở bàn học.', hint: '🪑' },
  { id: 'en_123', lang: 'en', term: 'chair', phonetic: '/tʃer/', translation: 'cái ghế', level: 1, pos: 'danh từ', example: 'Sit on the chair.', exampleTranslation: 'Ngồi xuống ghế đi.', hint: '🪑' },
  { id: 'en_124', lang: 'en', term: 'paper', phonetic: '/ˈpeɪpər/', translation: 'giấy', level: 1, pos: 'danh từ', example: 'I draw on paper.', exampleTranslation: 'Tôi vẽ trên giấy.', hint: '📄' },
  { id: 'en_125', lang: 'en', term: 'teacher', phonetic: '/ˈtiːtʃər/', translation: 'giáo viên', level: 1, pos: 'danh từ', example: 'My teacher is nice.', exampleTranslation: 'Cô giáo tôi tốt bụng.', hint: '👩\u200d🏫' },
  { id: 'en_126', lang: 'en', term: 'student', phonetic: '/ˈstuːdənt/', translation: 'học sinh', level: 1, pos: 'danh từ', example: 'I am a student.', exampleTranslation: 'Tôi là học sinh.', hint: '🧑\u200d🎓' },
  { id: 'en_127', lang: 'en', term: 'class', phonetic: '/klæs/', translation: 'lớp học', level: 1, pos: 'danh từ', example: 'The class is fun.', exampleTranslation: 'Lớp học vui.', hint: '🏫' },
  { id: 'en_128', lang: 'en', term: 'classroom', phonetic: '/ˈklæsruːm/', translation: 'phòng học', level: 1, pos: 'danh từ', example: 'My classroom is clean.', exampleTranslation: 'Phòng học sạch.', hint: '🚪' },
  { id: 'en_129', lang: 'en', term: 'ruler', phonetic: '/ˈruːlər/', translation: 'thước kẻ', level: 1, pos: 'danh từ', example: 'I have a ruler.', exampleTranslation: 'Tôi có một cây thước.', hint: '📏' },
  { id: 'en_130', lang: 'en', term: 'board', phonetic: '/bɔːrd/', translation: 'bảng', level: 1, pos: 'danh từ', example: 'Look at the board.', exampleTranslation: 'Nhìn lên bảng.', hint: '📋' },

  // ─── Clothes ────────────────────────────────────────────────────────
  { id: 'en_131', lang: 'en', term: 'shirt', phonetic: '/ʃɜːrt/', translation: 'áo sơ mi', level: 1, pos: 'danh từ', example: 'My shirt is blue.', exampleTranslation: 'Áo tôi màu xanh.', hint: '👕' },
  { id: 'en_132', lang: 'en', term: 'shoes', phonetic: '/ʃuːz/', translation: 'giày', level: 1, pos: 'danh từ', example: 'My shoes are new.', exampleTranslation: 'Giày tôi mới.', hint: '👟' },
  { id: 'en_133', lang: 'en', term: 'hat', phonetic: '/hæt/', translation: 'cái mũ', level: 1, pos: 'danh từ', example: 'I wear a hat.', exampleTranslation: 'Tôi đội mũ.', hint: '🎩' },
  { id: 'en_134', lang: 'en', term: 'dress', phonetic: '/dres/', translation: 'cái váy', level: 1, pos: 'danh từ', example: 'Her dress is pretty.', exampleTranslation: 'Váy cô ấy đẹp.', hint: '👗' },
  { id: 'en_135', lang: 'en', term: 'jacket', phonetic: '/ˈdʒækɪt/', translation: 'áo khoác', level: 1, pos: 'danh từ', example: 'Wear your jacket.', exampleTranslation: 'Mặc áo khoác vào.', hint: '🧥' },
  { id: 'en_136', lang: 'en', term: 'pants', phonetic: '/pænts/', translation: 'quần dài', level: 1, pos: 'danh từ', example: 'My pants are black.', exampleTranslation: 'Quần tôi màu đen.', hint: '👖' },
  { id: 'en_137', lang: 'en', term: 'socks', phonetic: '/sɒks/', translation: 'tất', level: 1, pos: 'danh từ', example: 'Put on your socks.', exampleTranslation: 'Đi tất vào.', hint: '🧦' },
  { id: 'en_138', lang: 'en', term: 'clothes', phonetic: '/kloʊðz/', translation: 'quần áo', level: 1, pos: 'danh từ', example: 'I wash my clothes.', exampleTranslation: 'Tôi giặt quần áo.', hint: '🧺' },

  // ─── Home ───────────────────────────────────────────────────────────
  { id: 'en_139', lang: 'en', term: 'house', phonetic: '/haʊs/', translation: 'ngôi nhà', level: 1, pos: 'danh từ', example: 'My house is small.', exampleTranslation: 'Nhà tôi nhỏ.', hint: '🏠' },
  { id: 'en_140', lang: 'en', term: 'home', phonetic: '/hoʊm/', translation: 'nhà (mái ấm)', level: 1, pos: 'danh từ', example: 'I am at home.', exampleTranslation: 'Tôi ở nhà.', hint: '🏡' },
  { id: 'en_141', lang: 'en', term: 'room', phonetic: '/ruːm/', translation: 'căn phòng', level: 1, pos: 'danh từ', example: 'My room is big.', exampleTranslation: 'Phòng tôi rộng.', hint: '🚪' },
  { id: 'en_142', lang: 'en', term: 'door', phonetic: '/dɔːr/', translation: 'cửa', level: 1, pos: 'danh từ', example: 'Open the door.', exampleTranslation: 'Mở cửa ra.', hint: '🚪' },
  { id: 'en_143', lang: 'en', term: 'window', phonetic: '/ˈwɪndoʊ/', translation: 'cửa sổ', level: 1, pos: 'danh từ', example: 'Close the window.', exampleTranslation: 'Đóng cửa sổ.', hint: '🪟' },
  { id: 'en_144', lang: 'en', term: 'bed', phonetic: '/bed/', translation: 'cái giường', level: 1, pos: 'danh từ', example: 'I sleep in bed.', exampleTranslation: 'Tôi ngủ trên giường.', hint: '🛏️' },
  { id: 'en_145', lang: 'en', term: 'table', phonetic: '/ˈteɪbəl/', translation: 'cái bàn', level: 1, pos: 'danh từ', example: 'Food is on the table.', exampleTranslation: 'Thức ăn ở trên bàn.', hint: '🪑' },
  { id: 'en_146', lang: 'en', term: 'kitchen', phonetic: '/ˈkɪtʃən/', translation: 'nhà bếp', level: 1, pos: 'danh từ', example: 'Mom is in the kitchen.', exampleTranslation: 'Mẹ ở trong bếp.', hint: '🍳' },
  { id: 'en_147', lang: 'en', term: 'bedroom', phonetic: '/ˈbedruːm/', translation: 'phòng ngủ', level: 1, pos: 'danh từ', example: 'My bedroom is pink.', exampleTranslation: 'Phòng ngủ tôi màu hồng.', hint: '🛌' },
  { id: 'en_148', lang: 'en', term: 'bathroom', phonetic: '/ˈbæθruːm/', translation: 'phòng tắm', level: 1, pos: 'danh từ', example: 'The bathroom is clean.', exampleTranslation: 'Phòng tắm sạch.', hint: '🛁' },

  // ─── Toys ───────────────────────────────────────────────────────────
  { id: 'en_149', lang: 'en', term: 'ball', phonetic: '/bɔːl/', translation: 'quả bóng', level: 1, pos: 'danh từ', example: 'I kick the ball.', exampleTranslation: 'Tôi đá bóng.', hint: '⚽' },
  { id: 'en_150', lang: 'en', term: 'toy', phonetic: '/tɔɪ/', translation: 'đồ chơi', level: 1, pos: 'danh từ', example: 'I love my toys.', exampleTranslation: 'Tôi yêu đồ chơi.', hint: '🧸' },
  { id: 'en_151', lang: 'en', term: 'doll', phonetic: '/dɒl/', translation: 'búp bê', level: 1, pos: 'danh từ', example: 'My doll has long hair.', exampleTranslation: 'Búp bê tôi tóc dài.', hint: '🪆' },
  { id: 'en_152', lang: 'en', term: 'car', phonetic: '/kɑːr/', translation: 'xe hơi', level: 1, pos: 'danh từ', example: 'The car is red.', exampleTranslation: 'Xe màu đỏ.', hint: '🚗' },
  { id: 'en_153', lang: 'en', term: 'bike', phonetic: '/baɪk/', translation: 'xe đạp', level: 1, pos: 'danh từ', example: 'I ride my bike.', exampleTranslation: 'Tôi đạp xe.', hint: '🚲' },
  { id: 'en_154', lang: 'en', term: 'kite', phonetic: '/kaɪt/', translation: 'con diều', level: 1, pos: 'danh từ', example: 'The kite flies high.', exampleTranslation: 'Con diều bay cao.', hint: '🪁' },
  { id: 'en_155', lang: 'en', term: 'game', phonetic: '/ɡeɪm/', translation: 'trò chơi', level: 1, pos: 'danh từ', example: 'I play a game.', exampleTranslation: 'Tôi chơi trò chơi.', hint: '🎮' },

  // ─── Verbs (basic action) ───────────────────────────────────────────
  { id: 'en_156', lang: 'en', term: 'go', phonetic: '/ɡoʊ/', translation: 'đi', level: 1, pos: 'động từ', example: 'I go home.', exampleTranslation: 'Tôi về nhà.', hint: '🚶' },
  { id: 'en_157', lang: 'en', term: 'come', phonetic: '/kʌm/', translation: 'đến', level: 1, pos: 'động từ', example: 'Come here.', exampleTranslation: 'Đến đây.', hint: '👋' },
  { id: 'en_158', lang: 'en', term: 'eat', phonetic: '/iːt/', translation: 'ăn', level: 1, pos: 'động từ', example: 'I eat lunch.', exampleTranslation: 'Tôi ăn trưa.', hint: '🍽️' },
  { id: 'en_159', lang: 'en', term: 'drink', phonetic: '/drɪŋk/', translation: 'uống', level: 1, pos: 'động từ', example: 'I drink water.', exampleTranslation: 'Tôi uống nước.', hint: '🥤' },
  { id: 'en_160', lang: 'en', term: 'sleep', phonetic: '/sliːp/', translation: 'ngủ', level: 1, pos: 'động từ', example: 'I sleep at night.', exampleTranslation: 'Tôi ngủ vào đêm.', hint: '😴' },
  { id: 'en_161', lang: 'en', term: 'play', phonetic: '/pleɪ/', translation: 'chơi', level: 1, pos: 'động từ', example: 'I play with friends.', exampleTranslation: 'Tôi chơi với bạn.', hint: '🎉' },
  { id: 'en_162', lang: 'en', term: 'run', phonetic: '/rʌn/', translation: 'chạy', level: 1, pos: 'động từ', example: 'I can run fast.', exampleTranslation: 'Tôi chạy nhanh.', hint: '🏃' },
  { id: 'en_163', lang: 'en', term: 'walk', phonetic: '/wɔːk/', translation: 'đi bộ', level: 1, pos: 'động từ', example: 'I walk to school.', exampleTranslation: 'Tôi đi bộ đến trường.', hint: '🚶' },
  { id: 'en_164', lang: 'en', term: 'jump', phonetic: '/dʒʌmp/', translation: 'nhảy', level: 1, pos: 'động từ', example: 'Jump high!', exampleTranslation: 'Nhảy cao lên!', hint: '🤸' },
  { id: 'en_165', lang: 'en', term: 'sit', phonetic: '/sɪt/', translation: 'ngồi', level: 1, pos: 'động từ', example: 'Sit down, please.', exampleTranslation: 'Ngồi xuống đi.', hint: '🪑' },
  { id: 'en_166', lang: 'en', term: 'stand', phonetic: '/stænd/', translation: 'đứng', level: 1, pos: 'động từ', example: 'Stand up, kids.', exampleTranslation: 'Đứng lên các em.', hint: '🧍' },
  { id: 'en_167', lang: 'en', term: 'see', phonetic: '/siː/', translation: 'thấy', level: 1, pos: 'động từ', example: 'I see a bird.', exampleTranslation: 'Tôi thấy một con chim.', hint: '👀' },
  { id: 'en_168', lang: 'en', term: 'look', phonetic: '/lʊk/', translation: 'nhìn', level: 1, pos: 'động từ', example: 'Look at this!', exampleTranslation: 'Nhìn cái này!', hint: '👀' },
  { id: 'en_169', lang: 'en', term: 'hear', phonetic: '/hɪr/', translation: 'nghe thấy', level: 1, pos: 'động từ', example: 'I hear music.', exampleTranslation: 'Tôi nghe nhạc.', hint: '👂' },
  { id: 'en_170', lang: 'en', term: 'listen', phonetic: '/ˈlɪsən/', translation: 'lắng nghe', level: 1, pos: 'động từ', example: 'Listen to mom.', exampleTranslation: 'Lắng nghe mẹ.', hint: '🎧' },
  { id: 'en_171', lang: 'en', term: 'speak', phonetic: '/spiːk/', translation: 'nói', level: 1, pos: 'động từ', example: 'I speak English.', exampleTranslation: 'Tôi nói tiếng Anh.', hint: '🗣️' },
  { id: 'en_172', lang: 'en', term: 'say', phonetic: '/seɪ/', translation: 'nói', level: 1, pos: 'động từ', example: 'Say hello.', exampleTranslation: 'Hãy chào.', hint: '💬' },
  { id: 'en_173', lang: 'en', term: 'read', phonetic: '/riːd/', translation: 'đọc', level: 1, pos: 'động từ', example: 'I read a book.', exampleTranslation: 'Tôi đọc sách.', hint: '📖' },
  { id: 'en_174', lang: 'en', term: 'write', phonetic: '/raɪt/', translation: 'viết', level: 1, pos: 'động từ', example: 'I write my name.', exampleTranslation: 'Tôi viết tên mình.', hint: '✍️' },
  { id: 'en_175', lang: 'en', term: 'sing', phonetic: '/sɪŋ/', translation: 'hát', level: 1, pos: 'động từ', example: 'I sing a song.', exampleTranslation: 'Tôi hát một bài.', hint: '🎤' },
  { id: 'en_176', lang: 'en', term: 'dance', phonetic: '/dæns/', translation: 'nhảy múa', level: 1, pos: 'động từ', example: 'We dance together.', exampleTranslation: 'Chúng tôi nhảy cùng nhau.', hint: '💃' },
  { id: 'en_177', lang: 'en', term: 'open', phonetic: '/ˈoʊpən/', translation: 'mở', level: 1, pos: 'động từ', example: 'Open the box.', exampleTranslation: 'Mở hộp ra.', hint: '📦' },
  { id: 'en_178', lang: 'en', term: 'close', phonetic: '/kloʊz/', translation: 'đóng', level: 1, pos: 'động từ', example: 'Close the door.', exampleTranslation: 'Đóng cửa.', hint: '🚪' },
  { id: 'en_179', lang: 'en', term: 'have', phonetic: '/hæv/', translation: 'có', level: 1, pos: 'động từ', example: 'I have a dog.', exampleTranslation: 'Tôi có một con chó.', hint: '🤲' },
  { id: 'en_180', lang: 'en', term: 'like', phonetic: '/laɪk/', translation: 'thích', level: 1, pos: 'động từ', example: 'I like ice cream.', exampleTranslation: 'Tôi thích kem.', hint: '❤️' },
  { id: 'en_181', lang: 'en', term: 'love', phonetic: '/lʌv/', translation: 'yêu', level: 1, pos: 'động từ', example: 'I love my mom.', exampleTranslation: 'Tôi yêu mẹ.', hint: '💖' },
  { id: 'en_182', lang: 'en', term: 'want', phonetic: '/wɒnt/', translation: 'muốn', level: 1, pos: 'động từ', example: 'I want a toy.', exampleTranslation: 'Tôi muốn đồ chơi.', hint: '🙏' },
  { id: 'en_183', lang: 'en', term: 'help', phonetic: '/help/', translation: 'giúp', level: 1, pos: 'động từ', example: 'Help me, please.', exampleTranslation: 'Giúp tôi với.', hint: '🆘' },
  { id: 'en_184', lang: 'en', term: 'know', phonetic: '/noʊ/', translation: 'biết', level: 1, pos: 'động từ', example: 'I know you.', exampleTranslation: 'Tôi biết bạn.', hint: '💡' },
  { id: 'en_185', lang: 'en', term: 'make', phonetic: '/meɪk/', translation: 'làm', level: 1, pos: 'động từ', example: 'I make a cake.', exampleTranslation: 'Tôi làm bánh.', hint: '🛠️' },
  { id: 'en_186', lang: 'en', term: 'do', phonetic: '/duː/', translation: 'làm', level: 1, pos: 'động từ', example: 'I do my homework.', exampleTranslation: 'Tôi làm bài tập.', hint: '✅' },
  { id: 'en_187', lang: 'en', term: 'is', phonetic: '/ɪz/', translation: 'là (ngôi 3 số ít)', level: 1, pos: 'động từ to be', example: 'She is happy.', exampleTranslation: 'Cô ấy vui.', hint: '➡️' },
  { id: 'en_188', lang: 'en', term: 'are', phonetic: '/ɑːr/', translation: 'là (số nhiều)', level: 1, pos: 'động từ to be', example: 'They are kids.', exampleTranslation: 'Họ là trẻ em.', hint: '➡️' },
  { id: 'en_189', lang: 'en', term: 'am', phonetic: '/æm/', translation: 'là (tôi)', level: 1, pos: 'động từ to be', example: 'I am Tom.', exampleTranslation: 'Tôi là Tom.', hint: '➡️' },
  { id: 'en_190', lang: 'en', term: 'can', phonetic: '/kæn/', translation: 'có thể', level: 1, pos: 'động từ khiếm khuyết', example: 'I can swim.', exampleTranslation: 'Tôi biết bơi.', hint: '💪' },

  // ─── Adjectives (basic) ─────────────────────────────────────────────
  { id: 'en_191', lang: 'en', term: 'big', phonetic: '/bɪɡ/', translation: 'to', level: 1, pos: 'tính từ', example: 'The dog is big.', exampleTranslation: 'Con chó to.', hint: '🐘' },
  { id: 'en_192', lang: 'en', term: 'small', phonetic: '/smɔːl/', translation: 'nhỏ', level: 1, pos: 'tính từ', example: 'The cat is small.', exampleTranslation: 'Con mèo nhỏ.', hint: '🐭' },
  { id: 'en_193', lang: 'en', term: 'happy', phonetic: '/ˈhæpi/', translation: 'vui vẻ', level: 1, pos: 'tính từ', example: 'I am happy.', exampleTranslation: 'Tôi vui.', hint: '😊' },
  { id: 'en_194', lang: 'en', term: 'sad', phonetic: '/sæd/', translation: 'buồn', level: 1, pos: 'tính từ', example: 'The boy is sad.', exampleTranslation: 'Cậu bé buồn.', hint: '😢' },
  { id: 'en_195', lang: 'en', term: 'good', phonetic: '/ɡʊd/', translation: 'tốt', level: 1, pos: 'tính từ', example: 'You are a good kid.', exampleTranslation: 'Bạn là đứa trẻ ngoan.', hint: '👍' },
  { id: 'en_196', lang: 'en', term: 'bad', phonetic: '/bæd/', translation: 'xấu', level: 1, pos: 'tính từ', example: 'That is bad.', exampleTranslation: 'Cái đó xấu.', hint: '👎' },
  { id: 'en_197', lang: 'en', term: 'hot', phonetic: '/hɒt/', translation: 'nóng', level: 1, pos: 'tính từ', example: 'The soup is hot.', exampleTranslation: 'Súp nóng.', hint: '🔥' },
  { id: 'en_198', lang: 'en', term: 'cold', phonetic: '/koʊld/', translation: 'lạnh', level: 1, pos: 'tính từ', example: 'Ice is cold.', exampleTranslation: 'Đá lạnh.', hint: '❄️' },
  { id: 'en_199', lang: 'en', term: 'new', phonetic: '/nuː/', translation: 'mới', level: 1, pos: 'tính từ', example: 'My bag is new.', exampleTranslation: 'Cặp tôi mới.', hint: '✨' },
  { id: 'en_200', lang: 'en', term: 'old', phonetic: '/oʊld/', translation: 'cũ/già', level: 1, pos: 'tính từ', example: 'My grandma is old.', exampleTranslation: 'Bà tôi già.', hint: '👵' },
  { id: 'en_201', lang: 'en', term: 'tall', phonetic: '/tɔːl/', translation: 'cao', level: 1, pos: 'tính từ', example: 'My dad is tall.', exampleTranslation: 'Bố tôi cao.', hint: '📏' },
  { id: 'en_202', lang: 'en', term: 'short', phonetic: '/ʃɔːrt/', translation: 'thấp/ngắn', level: 1, pos: 'tính từ', example: 'My hair is short.', exampleTranslation: 'Tóc tôi ngắn.', hint: '📐' },
  { id: 'en_203', lang: 'en', term: 'long', phonetic: '/lɒŋ/', translation: 'dài', level: 1, pos: 'tính từ', example: 'The snake is long.', exampleTranslation: 'Con rắn dài.', hint: '📏' },
  { id: 'en_204', lang: 'en', term: 'fast', phonetic: '/fæst/', translation: 'nhanh', level: 1, pos: 'tính từ', example: 'The car is fast.', exampleTranslation: 'Xe nhanh.', hint: '💨' },
  { id: 'en_205', lang: 'en', term: 'slow', phonetic: '/sloʊ/', translation: 'chậm', level: 1, pos: 'tính từ', example: 'The turtle is slow.', exampleTranslation: 'Con rùa chậm.', hint: '🐢' },
  { id: 'en_206', lang: 'en', term: 'pretty', phonetic: '/ˈprɪti/', translation: 'xinh', level: 1, pos: 'tính từ', example: 'The flower is pretty.', exampleTranslation: 'Bông hoa xinh.', hint: '🌸' },
  { id: 'en_207', lang: 'en', term: 'nice', phonetic: '/naɪs/', translation: 'tốt bụng/đẹp', level: 1, pos: 'tính từ', example: 'You are nice.', exampleTranslation: 'Bạn dễ thương.', hint: '😊' },
  { id: 'en_208', lang: 'en', term: 'funny', phonetic: '/ˈfʌni/', translation: 'buồn cười', level: 1, pos: 'tính từ', example: 'The clown is funny.', exampleTranslation: 'Chú hề buồn cười.', hint: '🤡' },

  // ─── Question words ─────────────────────────────────────────────────
  { id: 'en_209', lang: 'en', term: 'what', phonetic: '/wʌt/', translation: 'cái gì', level: 1, pos: 'từ để hỏi', example: 'What is this?', exampleTranslation: 'Đây là cái gì?', hint: '❓' },
  { id: 'en_210', lang: 'en', term: 'who', phonetic: '/huː/', translation: 'ai', level: 1, pos: 'từ để hỏi', example: 'Who is he?', exampleTranslation: 'Anh ấy là ai?', hint: '🤔' },
  { id: 'en_211', lang: 'en', term: 'where', phonetic: '/wer/', translation: 'ở đâu', level: 1, pos: 'từ để hỏi', example: 'Where is mom?', exampleTranslation: 'Mẹ ở đâu?', hint: '📍' },
  { id: 'en_212', lang: 'en', term: 'when', phonetic: '/wen/', translation: 'khi nào', level: 1, pos: 'từ để hỏi', example: 'When is your birthday?', exampleTranslation: 'Sinh nhật bạn khi nào?', hint: '📅' },
  { id: 'en_213', lang: 'en', term: 'how', phonetic: '/haʊ/', translation: 'như thế nào', level: 1, pos: 'từ để hỏi', example: 'How are you?', exampleTranslation: 'Bạn khỏe không?', hint: '❔' },
  { id: 'en_214', lang: 'en', term: 'why', phonetic: '/waɪ/', translation: 'tại sao', level: 1, pos: 'từ để hỏi', example: 'Why are you sad?', exampleTranslation: 'Sao bạn buồn?', hint: '🤷' },

  // ─── Time & calendar ────────────────────────────────────────────────
  { id: 'en_215', lang: 'en', term: 'day', phonetic: '/deɪ/', translation: 'ngày', level: 1, pos: 'danh từ', example: 'Have a good day.', exampleTranslation: 'Chúc ngày tốt lành.', hint: '☀️' },
  { id: 'en_216', lang: 'en', term: 'night', phonetic: '/naɪt/', translation: 'đêm', level: 1, pos: 'danh từ', example: 'Good night, mom.', exampleTranslation: 'Chúc mẹ ngủ ngon.', hint: '🌙' },
  { id: 'en_217', lang: 'en', term: 'morning', phonetic: '/ˈmɔːrnɪŋ/', translation: 'buổi sáng', level: 1, pos: 'danh từ', example: 'Good morning!', exampleTranslation: 'Chào buổi sáng!', hint: '🌅' },
  { id: 'en_218', lang: 'en', term: 'today', phonetic: '/təˈdeɪ/', translation: 'hôm nay', level: 1, pos: 'trạng từ', example: 'Today is sunny.', exampleTranslation: 'Hôm nay nắng.', hint: '📅' },
  { id: 'en_219', lang: 'en', term: 'time', phonetic: '/taɪm/', translation: 'thời gian', level: 1, pos: 'danh từ', example: 'What time is it?', exampleTranslation: 'Mấy giờ rồi?', hint: '⏰' },
  { id: 'en_220', lang: 'en', term: 'year', phonetic: '/jɪr/', translation: 'năm', level: 1, pos: 'danh từ', example: 'Happy New Year!', exampleTranslation: 'Chúc mừng năm mới!', hint: '🗓️' },

  // ─── Weather & nature ───────────────────────────────────────────────
  { id: 'en_221', lang: 'en', term: 'sun', phonetic: '/sʌn/', translation: 'mặt trời', level: 1, pos: 'danh từ', example: 'The sun is hot.', exampleTranslation: 'Mặt trời nóng.', hint: '☀️' },
  { id: 'en_222', lang: 'en', term: 'moon', phonetic: '/muːn/', translation: 'mặt trăng', level: 1, pos: 'danh từ', example: 'The moon is bright.', exampleTranslation: 'Trăng sáng.', hint: '🌙' },
  { id: 'en_223', lang: 'en', term: 'star', phonetic: '/stɑːr/', translation: 'ngôi sao', level: 1, pos: 'danh từ', example: 'I see stars.', exampleTranslation: 'Tôi thấy các ngôi sao.', hint: '⭐' },
  { id: 'en_224', lang: 'en', term: 'sky', phonetic: '/skaɪ/', translation: 'bầu trời', level: 1, pos: 'danh từ', example: 'The sky is blue.', exampleTranslation: 'Bầu trời xanh.', hint: '🌤️' },
  { id: 'en_225', lang: 'en', term: 'cloud', phonetic: '/klaʊd/', translation: 'mây', level: 1, pos: 'danh từ', example: 'The cloud is white.', exampleTranslation: 'Mây trắng.', hint: '☁️' },
  { id: 'en_226', lang: 'en', term: 'rain', phonetic: '/reɪn/', translation: 'mưa', level: 1, pos: 'danh từ', example: 'I like the rain.', exampleTranslation: 'Tôi thích mưa.', hint: '🌧️' },
  { id: 'en_227', lang: 'en', term: 'snow', phonetic: '/snoʊ/', translation: 'tuyết', level: 1, pos: 'danh từ', example: 'Snow is cold.', exampleTranslation: 'Tuyết lạnh.', hint: '❄️' },
  { id: 'en_228', lang: 'en', term: 'wind', phonetic: '/wɪnd/', translation: 'gió', level: 1, pos: 'danh từ', example: 'The wind is strong.', exampleTranslation: 'Gió mạnh.', hint: '💨' },
  { id: 'en_229', lang: 'en', term: 'tree', phonetic: '/triː/', translation: 'cái cây', level: 1, pos: 'danh từ', example: 'The tree is tall.', exampleTranslation: 'Cây cao.', hint: '🌳' },
  { id: 'en_230', lang: 'en', term: 'flower', phonetic: '/ˈflaʊər/', translation: 'bông hoa', level: 1, pos: 'danh từ', example: 'The flower is pretty.', exampleTranslation: 'Bông hoa đẹp.', hint: '🌸' },
  { id: 'en_231', lang: 'en', term: 'grass', phonetic: '/ɡræs/', translation: 'cỏ', level: 1, pos: 'danh từ', example: 'The grass is green.', exampleTranslation: 'Cỏ xanh.', hint: '🌱' },
  { id: 'en_232', lang: 'en', term: 'leaf', phonetic: '/liːf/', translation: 'chiếc lá', level: 1, pos: 'danh từ', example: 'The leaf is yellow.', exampleTranslation: 'Lá vàng.', hint: '🍃' },

  // ─── Places ─────────────────────────────────────────────────────────
  { id: 'en_233', lang: 'en', term: 'park', phonetic: '/pɑːrk/', translation: 'công viên', level: 1, pos: 'danh từ', example: 'Let\'s go to the park.', exampleTranslation: 'Đi công viên đi.', hint: '🏞️' },
  { id: 'en_234', lang: 'en', term: 'shop', phonetic: '/ʃɒp/', translation: 'cửa hàng', level: 1, pos: 'danh từ', example: 'The shop is open.', exampleTranslation: 'Cửa hàng mở cửa.', hint: '🏪' },
  { id: 'en_235', lang: 'en', term: 'street', phonetic: '/striːt/', translation: 'đường phố', level: 1, pos: 'danh từ', example: 'The street is busy.', exampleTranslation: 'Đường đông.', hint: '🛣️' },
  { id: 'en_236', lang: 'en', term: 'city', phonetic: '/ˈsɪti/', translation: 'thành phố', level: 1, pos: 'danh từ', example: 'I live in a city.', exampleTranslation: 'Tôi sống ở thành phố.', hint: '🏙️' },
  { id: 'en_237', lang: 'en', term: 'farm', phonetic: '/fɑːrm/', translation: 'nông trại', level: 1, pos: 'danh từ', example: 'Cows live on a farm.', exampleTranslation: 'Bò sống ở nông trại.', hint: '🚜' },
  { id: 'en_238', lang: 'en', term: 'zoo', phonetic: '/zuː/', translation: 'sở thú', level: 1, pos: 'danh từ', example: 'I see lions at the zoo.', exampleTranslation: 'Tôi thấy sư tử ở sở thú.', hint: '🦒' },

  // ─── Common nouns + closers ─────────────────────────────────────────
  { id: 'en_239', lang: 'en', term: 'thing', phonetic: '/θɪŋ/', translation: 'đồ vật', level: 1, pos: 'danh từ', example: 'What is this thing?', exampleTranslation: 'Cái này là gì vậy?', hint: '📦' },
  { id: 'en_240', lang: 'en', term: 'place', phonetic: '/pleɪs/', translation: 'nơi chốn', level: 1, pos: 'danh từ', example: 'This place is fun.', exampleTranslation: 'Nơi này vui.', hint: '📍' },
  { id: 'en_241', lang: 'en', term: 'a', phonetic: '/ə/', translation: 'một (mạo từ)', level: 1, pos: 'mạo từ', example: 'I have a cat.', exampleTranslation: 'Tôi có một con mèo.', hint: '🅰️' },
  { id: 'en_242', lang: 'en', term: 'an', phonetic: '/æn/', translation: 'một (trước nguyên âm)', level: 1, pos: 'mạo từ', example: 'I eat an apple.', exampleTranslation: 'Tôi ăn một quả táo.', hint: '🅰️' },
  { id: 'en_243', lang: 'en', term: 'the', phonetic: '/ðə/', translation: 'cái/con (xác định)', level: 1, pos: 'mạo từ', example: 'The dog runs fast.', exampleTranslation: 'Con chó chạy nhanh.', hint: '➡️' },
  { id: 'en_244', lang: 'en', term: 'and', phonetic: '/ænd/', translation: 'và', level: 1, pos: 'liên từ', example: 'Mom and dad.', exampleTranslation: 'Mẹ và bố.', hint: '➕' },
  { id: 'en_245', lang: 'en', term: 'or', phonetic: '/ɔːr/', translation: 'hoặc', level: 1, pos: 'liên từ', example: 'Tea or milk?', exampleTranslation: 'Trà hay sữa?', hint: '⚖️' },
  { id: 'en_246', lang: 'en', term: 'but', phonetic: '/bʌt/', translation: 'nhưng', level: 1, pos: 'liên từ', example: 'I am tired but happy.', exampleTranslation: 'Tôi mệt nhưng vui.', hint: '🔄' },
  { id: 'en_247', lang: 'en', term: 'in', phonetic: '/ɪn/', translation: 'trong', level: 1, pos: 'giới từ', example: 'I am in the room.', exampleTranslation: 'Tôi ở trong phòng.', hint: '📥' },
  { id: 'en_248', lang: 'en', term: 'on', phonetic: '/ɒn/', translation: 'trên', level: 1, pos: 'giới từ', example: 'The book is on the table.', exampleTranslation: 'Sách ở trên bàn.', hint: '⬆️' },
  { id: 'en_249', lang: 'en', term: 'under', phonetic: '/ˈʌndər/', translation: 'dưới', level: 1, pos: 'giới từ', example: 'The cat is under the bed.', exampleTranslation: 'Con mèo dưới giường.', hint: '⬇️' },
  { id: 'en_250', lang: 'en', term: 'with', phonetic: '/wɪð/', translation: 'với', level: 1, pos: 'giới từ', example: 'I play with friends.', exampleTranslation: 'Tôi chơi với bạn.', hint: '🤝' },
  { id: 'en_251', lang: 'en', term: 'to', phonetic: '/tuː/', translation: 'đến', level: 1, pos: 'giới từ', example: 'Go to school.', exampleTranslation: 'Đi đến trường.', hint: '➡️' },
  { id: 'en_252', lang: 'en', term: 'of', phonetic: '/ʌv/', translation: 'của', level: 1, pos: 'giới từ', example: 'A cup of tea.', exampleTranslation: 'Một tách trà.', hint: '🔗' },
  { id: 'en_253', lang: 'en', term: 'for', phonetic: '/fɔːr/', translation: 'cho', level: 1, pos: 'giới từ', example: 'This is for you.', exampleTranslation: 'Cái này cho bạn.', hint: '🎁' },
  { id: 'en_254', lang: 'en', term: 'at', phonetic: '/æt/', translation: 'tại', level: 1, pos: 'giới từ', example: 'I am at home.', exampleTranslation: 'Tôi ở nhà.', hint: '📍' },

  // ─── Simple adverbs / closers ───────────────────────────────────────
  { id: 'en_255', lang: 'en', term: 'now', phonetic: '/naʊ/', translation: 'bây giờ', level: 1, pos: 'trạng từ', example: 'Come here now.', exampleTranslation: 'Đến đây ngay.', hint: '⏰' },
  { id: 'en_256', lang: 'en', term: 'here', phonetic: '/hɪr/', translation: 'ở đây', level: 1, pos: 'trạng từ', example: 'I am here.', exampleTranslation: 'Tôi ở đây.', hint: '📍' },
  { id: 'en_257', lang: 'en', term: 'there', phonetic: '/ðer/', translation: 'ở đó', level: 1, pos: 'trạng từ', example: 'Look there!', exampleTranslation: 'Nhìn đó kìa!', hint: '👉' },
  { id: 'en_258', lang: 'en', term: 'very', phonetic: '/ˈveri/', translation: 'rất', level: 1, pos: 'trạng từ', example: 'I am very happy.', exampleTranslation: 'Tôi rất vui.', hint: '💯' },
  { id: 'en_259', lang: 'en', term: 'too', phonetic: '/tuː/', translation: 'cũng', level: 1, pos: 'trạng từ', example: 'Me too!', exampleTranslation: 'Tôi cũng vậy!', hint: '➕' },
  { id: 'en_260', lang: 'en', term: 'not', phonetic: '/nɒt/', translation: 'không', level: 1, pos: 'trạng từ', example: 'I am not sad.', exampleTranslation: 'Tôi không buồn.', hint: '🚫' },
  { id: 'en_261', lang: 'en', term: 'all', phonetic: '/ɔːl/', translation: 'tất cả', level: 1, pos: 'tính từ', example: 'All kids are here.', exampleTranslation: 'Tất cả các bé đây.', hint: '🌐' },
  { id: 'en_262', lang: 'en', term: 'some', phonetic: '/sʌm/', translation: 'một vài', level: 1, pos: 'tính từ', example: 'Eat some bread.', exampleTranslation: 'Ăn một ít bánh.', hint: '🍞' },
  { id: 'en_263', lang: 'en', term: 'many', phonetic: '/ˈmeni/', translation: 'nhiều', level: 1, pos: 'tính từ', example: 'I have many books.', exampleTranslation: 'Tôi có nhiều sách.', hint: '📚' },
  { id: 'en_264', lang: 'en', term: 'one', phonetic: '/wʌn/', translation: 'một (đại từ)', level: 1, pos: 'đại từ', example: 'This one is mine.', exampleTranslation: 'Cái này của tôi.', hint: '☝️' },

  // ─── More animals / sounds (Cambridge YLE specific) ─────────────────
  { id: 'en_265', lang: 'en', term: 'sheep', phonetic: '/ʃiːp/', translation: 'con cừu', level: 1, pos: 'danh từ', example: 'The sheep is white.', exampleTranslation: 'Con cừu trắng.', hint: '🐑' },
  { id: 'en_266', lang: 'en', term: 'goat', phonetic: '/ɡoʊt/', translation: 'con dê', level: 1, pos: 'danh từ', example: 'The goat eats grass.', exampleTranslation: 'Con dê ăn cỏ.', hint: '🐐' },
  { id: 'en_267', lang: 'en', term: 'snake', phonetic: '/sneɪk/', translation: 'con rắn', level: 1, pos: 'danh từ', example: 'The snake is long.', exampleTranslation: 'Con rắn dài.', hint: '🐍' },

  // ─── More food ──────────────────────────────────────────────────────
  { id: 'en_268', lang: 'en', term: 'fruit', phonetic: '/fruːt/', translation: 'trái cây', level: 1, pos: 'danh từ', example: 'I love fruit.', exampleTranslation: 'Tôi yêu trái cây.', hint: '🍓' },
  { id: 'en_269', lang: 'en', term: 'pizza', phonetic: '/ˈpiːtsə/', translation: 'pizza', level: 1, pos: 'danh từ', example: 'I want pizza.', exampleTranslation: 'Tôi muốn pizza.', hint: '🍕' },
  { id: 'en_270', lang: 'en', term: 'ice cream', phonetic: '/aɪs kriːm/', translation: 'kem', level: 1, pos: 'danh từ', example: 'Ice cream is cold.', exampleTranslation: 'Kem lạnh.', hint: '🍦' },

  // ─── Final common verbs ─────────────────────────────────────────────
  { id: 'en_271', lang: 'en', term: 'fly', phonetic: '/flaɪ/', translation: 'bay', level: 1, pos: 'động từ', example: 'Birds fly high.', exampleTranslation: 'Chim bay cao.', hint: '🦋' },
  { id: 'en_272', lang: 'en', term: 'swim', phonetic: '/swɪm/', translation: 'bơi', level: 1, pos: 'động từ', example: 'I can swim.', exampleTranslation: 'Tôi biết bơi.', hint: '🏊' },
  { id: 'en_273', lang: 'en', term: 'draw', phonetic: '/drɔː/', translation: 'vẽ', level: 1, pos: 'động từ', example: 'I draw a cat.', exampleTranslation: 'Tôi vẽ con mèo.', hint: '🎨' },
  { id: 'en_274', lang: 'en', term: 'count', phonetic: '/kaʊnt/', translation: 'đếm', level: 1, pos: 'động từ', example: 'I count to ten.', exampleTranslation: 'Tôi đếm đến mười.', hint: '🔢' },

  // ─── Misc Starters ──────────────────────────────────────────────────
  { id: 'en_275', lang: 'en', term: 'birthday', phonetic: '/ˈbɜːrθdeɪ/', translation: 'sinh nhật', level: 1, pos: 'danh từ', example: 'Happy birthday!', exampleTranslation: 'Chúc mừng sinh nhật!', hint: '🎂' },
  { id: 'en_276', lang: 'en', term: 'present', phonetic: '/ˈprezənt/', translation: 'món quà', level: 1, pos: 'danh từ', example: 'A present for you.', exampleTranslation: 'Một món quà cho bạn.', hint: '🎁' },
  { id: 'en_277', lang: 'en', term: 'hello', phonetic: '/həˈloʊ/', translation: 'xin chào (lặp)', level: 1, pos: 'thán từ', example: 'Say hello to grandma.', exampleTranslation: 'Chào bà đi.', hint: '👋' },
  { id: 'en_278', lang: 'en', term: 'school bag', phonetic: '/skuːl bæɡ/', translation: 'cặp sách', level: 1, pos: 'danh từ', example: 'My school bag is blue.', exampleTranslation: 'Cặp tôi màu xanh.', hint: '🎒' },
  { id: 'en_279', lang: 'en', term: 'little', phonetic: '/ˈlɪtəl/', translation: 'nhỏ bé', level: 1, pos: 'tính từ', example: 'A little dog.', exampleTranslation: 'Một con chó nhỏ.', hint: '🐶' },
  { id: 'en_280', lang: 'en', term: 'great', phonetic: '/ɡreɪt/', translation: 'tuyệt', level: 1, pos: 'tính từ', example: 'You are great!', exampleTranslation: 'Bạn tuyệt vời!', hint: '🎉' },
];
