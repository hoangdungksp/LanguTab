import type { Word } from '../../types';

/**
 * Level 4 — School vocabulary (basic).
 *
 * Target audience: trẻ em lớp 4-5 (10-11 tuổi). Vocabulary phù hợp với
 * chương trình tiếng Anh tiểu học Việt Nam: subjects, classroom activities,
 * geography basics, science introduction.
 *
 * User-facing label: "Cấp 4 — Tiểu học cơ bản".
 */
export const enLevel4: Word[] = [
  // ─── School subjects ────────────────────────────────────────────────
  { id: 'en_641', lang: 'en', term: 'subject', phonetic: '/ˈsʌbdʒɪkt/', translation: 'môn học', level: 4, pos: 'danh từ', example: 'My favorite subject is math.', exampleTranslation: 'Môn ưa thích của tôi là toán.', hint: '📚' },
  { id: 'en_642', lang: 'en', term: 'math', phonetic: '/mæθ/', translation: 'toán', level: 4, pos: 'danh từ', example: 'Math is hard.', exampleTranslation: 'Toán khó.', hint: '🔢' },
  { id: 'en_643', lang: 'en', term: 'science', phonetic: '/ˈsaɪəns/', translation: 'khoa học', level: 4, pos: 'danh từ', example: 'Science is fun.', exampleTranslation: 'Khoa học vui.', hint: '🔬' },
  { id: 'en_644', lang: 'en', term: 'history', phonetic: '/ˈhɪstəri/', translation: 'lịch sử', level: 4, pos: 'danh từ', example: 'History is interesting.', exampleTranslation: 'Lịch sử thú vị.', hint: '📜' },
  { id: 'en_645', lang: 'en', term: 'geography', phonetic: '/dʒiˈɒɡrəfi/', translation: 'địa lý', level: 4, pos: 'danh từ', example: 'Geography teaches maps.', exampleTranslation: 'Địa lý dạy về bản đồ.', hint: '🗺️' },
  { id: 'en_646', lang: 'en', term: 'art', phonetic: '/ɑːrt/', translation: 'mỹ thuật', level: 4, pos: 'danh từ', example: 'Art class is creative.', exampleTranslation: 'Lớp mỹ thuật sáng tạo.', hint: '🎨' },
  { id: 'en_647', lang: 'en', term: 'English', phonetic: '/ˈɪŋɡlɪʃ/', translation: 'tiếng Anh', level: 4, pos: 'danh từ', example: 'I study English.', exampleTranslation: 'Tôi học tiếng Anh.', hint: '🇬🇧' },
  { id: 'en_648', lang: 'en', term: 'Vietnamese', phonetic: '/ˌvjetnəˈmiːz/', translation: 'tiếng Việt', level: 4, pos: 'danh từ', example: 'I speak Vietnamese.', exampleTranslation: 'Tôi nói tiếng Việt.', hint: '🇻🇳' },
  { id: 'en_649', lang: 'en', term: 'PE', phonetic: '/ˌpiː ˈiː/', translation: 'thể dục', level: 4, pos: 'danh từ', example: 'PE class is active.', exampleTranslation: 'Thể dục năng động.', hint: '🏃' },
  { id: 'en_650', lang: 'en', term: 'lesson', phonetic: '/ˈlesən/', translation: 'bài học', level: 4, pos: 'danh từ', example: 'A long lesson.', exampleTranslation: 'Bài học dài.', hint: '📖' },
  { id: 'en_651', lang: 'en', term: 'homework', phonetic: '/ˈhoʊmwɜːrk/', translation: 'bài tập về nhà', level: 4, pos: 'danh từ', example: 'Do your homework.', exampleTranslation: 'Làm bài tập đi.', hint: '✏️' },
  { id: 'en_652', lang: 'en', term: 'test', phonetic: '/test/', translation: 'bài kiểm tra', level: 4, pos: 'danh từ', example: 'A math test today.', exampleTranslation: 'Hôm nay kiểm tra toán.', hint: '📝' },
  { id: 'en_653', lang: 'en', term: 'exam', phonetic: '/ɪɡˈzæm/', translation: 'kỳ thi', level: 4, pos: 'danh từ', example: 'Final exam is hard.', exampleTranslation: 'Bài thi cuối khó.', hint: '🎓' },
  { id: 'en_654', lang: 'en', term: 'grade', phonetic: '/ɡreɪd/', translation: 'điểm/lớp', level: 4, pos: 'danh từ', example: 'Good grades make me happy.', exampleTranslation: 'Điểm tốt làm tôi vui.', hint: '💯' },
  { id: 'en_655', lang: 'en', term: 'mark', phonetic: '/mɑːrk/', translation: 'điểm số', level: 4, pos: 'danh từ', example: 'Get good marks.', exampleTranslation: 'Lấy điểm tốt nhé.', hint: '📊' },

  // ─── Classroom items ────────────────────────────────────────────────
  { id: 'en_656', lang: 'en', term: 'notebook', phonetic: '/ˈnoʊtbʊk/', translation: 'vở', level: 4, pos: 'danh từ', example: 'A new notebook.', exampleTranslation: 'Một quyển vở mới.', hint: '📓' },
  { id: 'en_657', lang: 'en', term: 'eraser', phonetic: '/ɪˈreɪsər/', translation: 'cục tẩy', level: 4, pos: 'danh từ', example: 'I need an eraser.', exampleTranslation: 'Tôi cần cục tẩy.', hint: '🧽' },
  { id: 'en_658', lang: 'en', term: 'scissors', phonetic: '/ˈsɪzərz/', translation: 'kéo', level: 4, pos: 'danh từ', example: 'Use the scissors carefully.', exampleTranslation: 'Dùng kéo cẩn thận.', hint: '✂️' },
  { id: 'en_659', lang: 'en', term: 'glue', phonetic: '/ɡluː/', translation: 'keo dán', level: 4, pos: 'danh từ', example: 'Pass me the glue.', exampleTranslation: 'Đưa tôi keo dán.', hint: '📎' },
  { id: 'en_660', lang: 'en', term: 'crayon', phonetic: '/ˈkreɪɒn/', translation: 'sáp màu', level: 4, pos: 'danh từ', example: 'Color with crayons.', exampleTranslation: 'Tô bằng sáp màu.', hint: '🖍️' },
  { id: 'en_661', lang: 'en', term: 'marker', phonetic: '/ˈmɑːrkər/', translation: 'bút lông', level: 4, pos: 'danh từ', example: 'A blue marker.', exampleTranslation: 'Cây bút lông xanh.', hint: '🖊️' },
  { id: 'en_662', lang: 'en', term: 'dictionary', phonetic: '/ˈdɪkʃəneri/', translation: 'từ điển', level: 4, pos: 'danh từ', example: 'Use the dictionary.', exampleTranslation: 'Dùng từ điển đi.', hint: '📕' },
  { id: 'en_663', lang: 'en', term: 'page', phonetic: '/peɪdʒ/', translation: 'trang', level: 4, pos: 'danh từ', example: 'Open page ten.', exampleTranslation: 'Mở trang 10.', hint: '📃' },
  { id: 'en_664', lang: 'en', term: 'word', phonetic: '/wɜːrd/', translation: 'từ', level: 4, pos: 'danh từ', example: 'A new word.', exampleTranslation: 'Một từ mới.', hint: '🔤' },
  { id: 'en_665', lang: 'en', term: 'sentence', phonetic: '/ˈsentəns/', translation: 'câu', level: 4, pos: 'danh từ', example: 'Write a sentence.', exampleTranslation: 'Viết một câu.', hint: '📝' },
  { id: 'en_666', lang: 'en', term: 'question', phonetic: '/ˈkwestʃən/', translation: 'câu hỏi', level: 4, pos: 'danh từ', example: 'I have a question.', exampleTranslation: 'Tôi có một câu hỏi.', hint: '❓' },
  { id: 'en_667', lang: 'en', term: 'answer', phonetic: '/ˈænsər/', translation: 'câu trả lời', level: 4, pos: 'danh từ', example: 'The right answer.', exampleTranslation: 'Câu trả lời đúng.', hint: '✅' },

  // ─── Geography ──────────────────────────────────────────────────────
  { id: 'en_668', lang: 'en', term: 'continent', phonetic: '/ˈkɒntɪnənt/', translation: 'lục địa', level: 4, pos: 'danh từ', example: 'Asia is a continent.', exampleTranslation: 'Châu Á là lục địa.', hint: '🌍' },
  { id: 'en_669', lang: 'en', term: 'ocean', phonetic: '/ˈoʊʃən/', translation: 'đại dương', level: 4, pos: 'danh từ', example: 'The Pacific Ocean is huge.', exampleTranslation: 'Thái Bình Dương rộng lớn.', hint: '🌊' },
  { id: 'en_670', lang: 'en', term: 'desert', phonetic: '/ˈdezərt/', translation: 'sa mạc', level: 4, pos: 'danh từ', example: 'The desert is hot.', exampleTranslation: 'Sa mạc nóng.', hint: '🏜️' },
  { id: 'en_671', lang: 'en', term: 'jungle', phonetic: '/ˈdʒʌŋɡəl/', translation: 'rừng nhiệt đới', level: 4, pos: 'danh từ', example: 'Tigers live in jungles.', exampleTranslation: 'Hổ sống trong rừng nhiệt đới.', hint: '🌴' },
  { id: 'en_672', lang: 'en', term: 'valley', phonetic: '/ˈvæli/', translation: 'thung lũng', level: 4, pos: 'danh từ', example: 'A green valley.', exampleTranslation: 'Một thung lũng xanh.', hint: '🏞️' },
  { id: 'en_673', lang: 'en', term: 'hill', phonetic: '/hɪl/', translation: 'đồi', level: 4, pos: 'danh từ', example: 'Climb the hill.', exampleTranslation: 'Leo đồi đi.', hint: '⛰️' },
  { id: 'en_674', lang: 'en', term: 'cave', phonetic: '/keɪv/', translation: 'hang động', level: 4, pos: 'danh từ', example: 'Bats live in caves.', exampleTranslation: 'Dơi sống trong hang.', hint: '🕳️' },
  { id: 'en_675', lang: 'en', term: 'volcano', phonetic: '/vɒlˈkeɪnoʊ/', translation: 'núi lửa', level: 4, pos: 'danh từ', example: 'A hot volcano.', exampleTranslation: 'Núi lửa nóng.', hint: '🌋' },
  { id: 'en_676', lang: 'en', term: 'pond', phonetic: '/pɒnd/', translation: 'ao', level: 4, pos: 'danh từ', example: 'Frogs in the pond.', exampleTranslation: 'Ếch trong ao.', hint: '🪷' },
  { id: 'en_677', lang: 'en', term: 'waterfall', phonetic: '/ˈwɔːtərfɔːl/', translation: 'thác nước', level: 4, pos: 'danh từ', example: 'A pretty waterfall.', exampleTranslation: 'Thác nước đẹp.', hint: '💦' },
  { id: 'en_678', lang: 'en', term: 'north', phonetic: '/nɔːrθ/', translation: 'phía bắc', level: 4, pos: 'danh từ', example: 'Hanoi is in the north.', exampleTranslation: 'Hà Nội ở phía bắc.', hint: '⬆️' },
  { id: 'en_679', lang: 'en', term: 'south', phonetic: '/saʊθ/', translation: 'phía nam', level: 4, pos: 'danh từ', example: 'I live in the south.', exampleTranslation: 'Tôi sống ở phía nam.', hint: '⬇️' },
  { id: 'en_680', lang: 'en', term: 'east', phonetic: '/iːst/', translation: 'phía đông', level: 4, pos: 'danh từ', example: 'The sun rises in the east.', exampleTranslation: 'Mặt trời mọc phía đông.', hint: '➡️' },
  { id: 'en_681', lang: 'en', term: 'west', phonetic: '/west/', translation: 'phía tây', level: 4, pos: 'danh từ', example: 'The sun sets in the west.', exampleTranslation: 'Mặt trời lặn phía tây.', hint: '⬅️' },

  // ─── Science basics ─────────────────────────────────────────────────
  { id: 'en_682', lang: 'en', term: 'air', phonetic: '/er/', translation: 'không khí', level: 4, pos: 'danh từ', example: 'Clean air is good.', exampleTranslation: 'Không khí sạch tốt.', hint: '💨' },
  { id: 'en_683', lang: 'en', term: 'gas', phonetic: '/ɡæs/', translation: 'khí gas', level: 4, pos: 'danh từ', example: 'Gas is invisible.', exampleTranslation: 'Khí gas vô hình.', hint: '💨' },
  { id: 'en_684', lang: 'en', term: 'liquid', phonetic: '/ˈlɪkwɪd/', translation: 'chất lỏng', level: 4, pos: 'danh từ', example: 'Water is a liquid.', exampleTranslation: 'Nước là chất lỏng.', hint: '💧' },
  { id: 'en_685', lang: 'en', term: 'solid', phonetic: '/ˈsɒlɪd/', translation: 'chất rắn', level: 4, pos: 'danh từ', example: 'Ice is solid.', exampleTranslation: 'Đá là chất rắn.', hint: '🧊' },
  { id: 'en_686', lang: 'en', term: 'metal', phonetic: '/ˈmetəl/', translation: 'kim loại', level: 4, pos: 'danh từ', example: 'Iron is a metal.', exampleTranslation: 'Sắt là kim loại.', hint: '🔧' },
  { id: 'en_687', lang: 'en', term: 'wood', phonetic: '/wʊd/', translation: 'gỗ', level: 4, pos: 'danh từ', example: 'A wood table.', exampleTranslation: 'Bàn gỗ.', hint: '🪵' },
  { id: 'en_688', lang: 'en', term: 'plastic', phonetic: '/ˈplæstɪk/', translation: 'nhựa', level: 4, pos: 'danh từ', example: 'A plastic bottle.', exampleTranslation: 'Chai nhựa.', hint: '🥤' },
  { id: 'en_689', lang: 'en', term: 'glass', phonetic: '/ɡlæs/', translation: 'thủy tinh', level: 4, pos: 'danh từ', example: 'A glass window.', exampleTranslation: 'Cửa sổ thủy tinh.', hint: '🪟' },
  { id: 'en_690', lang: 'en', term: 'paper', phonetic: '/ˈpeɪpər/', translation: 'giấy', level: 4, pos: 'danh từ', example: 'Recycle paper.', exampleTranslation: 'Tái chế giấy.', hint: '📄' },
  { id: 'en_691', lang: 'en', term: 'rock', phonetic: '/rɒk/', translation: 'đá', level: 4, pos: 'danh từ', example: 'A big rock.', exampleTranslation: 'Một tảng đá to.', hint: '🪨' },
  { id: 'en_692', lang: 'en', term: 'sand', phonetic: '/sænd/', translation: 'cát', level: 4, pos: 'danh từ', example: 'I play in the sand.', exampleTranslation: 'Tôi chơi cát.', hint: '🏖️' },
  { id: 'en_693', lang: 'en', term: 'mud', phonetic: '/mʌd/', translation: 'bùn', level: 4, pos: 'danh từ', example: 'My shoes have mud.', exampleTranslation: 'Giày tôi có bùn.', hint: '🟫' },
  { id: 'en_694', lang: 'en', term: 'fire', phonetic: '/ˈfaɪər/', translation: 'lửa', level: 4, pos: 'danh từ', example: 'Don\'t play with fire.', exampleTranslation: 'Đừng chơi với lửa.', hint: '🔥' },
  { id: 'en_695', lang: 'en', term: 'ice', phonetic: '/aɪs/', translation: 'đá lạnh', level: 4, pos: 'danh từ', example: 'Ice is cold.', exampleTranslation: 'Đá lạnh.', hint: '🧊' },
  { id: 'en_696', lang: 'en', term: 'energy', phonetic: '/ˈenərdʒi/', translation: 'năng lượng', level: 4, pos: 'danh từ', example: 'Save energy.', exampleTranslation: 'Tiết kiệm năng lượng.', hint: '⚡' },
  { id: 'en_697', lang: 'en', term: 'electricity', phonetic: '/ɪˌlekˈtrɪsəti/', translation: 'điện', level: 4, pos: 'danh từ', example: 'Save electricity.', exampleTranslation: 'Tiết kiệm điện.', hint: '🔌' },

  // ─── Living things ──────────────────────────────────────────────────
  { id: 'en_698', lang: 'en', term: 'plant', phonetic: '/plænt/', translation: 'cây/thực vật', level: 4, pos: 'danh từ', example: 'Water the plant.', exampleTranslation: 'Tưới cây.', hint: '🪴' },
  { id: 'en_699', lang: 'en', term: 'seed', phonetic: '/siːd/', translation: 'hạt giống', level: 4, pos: 'danh từ', example: 'Plant a seed.', exampleTranslation: 'Trồng hạt giống.', hint: '🌱' },
  { id: 'en_700', lang: 'en', term: 'root', phonetic: '/ruːt/', translation: 'rễ cây', level: 4, pos: 'danh từ', example: 'Strong roots.', exampleTranslation: 'Rễ chắc.', hint: '🌳' },
  { id: 'en_701', lang: 'en', term: 'branch', phonetic: '/bræntʃ/', translation: 'cành cây', level: 4, pos: 'danh từ', example: 'A long branch.', exampleTranslation: 'Cành dài.', hint: '🌿' },
  { id: 'en_702', lang: 'en', term: 'fruit', phonetic: '/fruːt/', translation: 'trái cây', level: 4, pos: 'danh từ', example: 'Fresh fruit is good.', exampleTranslation: 'Trái cây tươi tốt.', hint: '🍎' },
  { id: 'en_703', lang: 'en', term: 'vegetable', phonetic: '/ˈvedʒtəbəl/', translation: 'rau', level: 4, pos: 'danh từ', example: 'Eat your vegetables.', exampleTranslation: 'Ăn rau đi.', hint: '🥬' },
  { id: 'en_704', lang: 'en', term: 'insect', phonetic: '/ˈɪnsekt/', translation: 'côn trùng', level: 4, pos: 'danh từ', example: 'Insects are small.', exampleTranslation: 'Côn trùng nhỏ.', hint: '🐛' },
  { id: 'en_705', lang: 'en', term: 'wing', phonetic: '/wɪŋ/', translation: 'cánh', level: 4, pos: 'danh từ', example: 'Birds have wings.', exampleTranslation: 'Chim có cánh.', hint: '🪽' },
  { id: 'en_706', lang: 'en', term: 'tail', phonetic: '/teɪl/', translation: 'đuôi', level: 4, pos: 'danh từ', example: 'A long tail.', exampleTranslation: 'Đuôi dài.', hint: '🐈' },
  { id: 'en_707', lang: 'en', term: 'feather', phonetic: '/ˈfeðər/', translation: 'lông vũ', level: 4, pos: 'danh từ', example: 'A pretty feather.', exampleTranslation: 'Lông đẹp.', hint: '🪶' },

  // ─── Body health ────────────────────────────────────────────────────
  { id: 'en_708', lang: 'en', term: 'bone', phonetic: '/boʊn/', translation: 'xương', level: 4, pos: 'danh từ', example: 'Strong bones.', exampleTranslation: 'Xương chắc.', hint: '🦴' },
  { id: 'en_709', lang: 'en', term: 'blood', phonetic: '/blʌd/', translation: 'máu', level: 4, pos: 'danh từ', example: 'Red blood.', exampleTranslation: 'Máu đỏ.', hint: '🩸' },
  { id: 'en_710', lang: 'en', term: 'heart', phonetic: '/hɑːrt/', translation: 'tim', level: 4, pos: 'danh từ', example: 'My heart beats fast.', exampleTranslation: 'Tim tôi đập nhanh.', hint: '❤️' },
  { id: 'en_711', lang: 'en', term: 'brain', phonetic: '/breɪn/', translation: 'não', level: 4, pos: 'danh từ', example: 'Use your brain.', exampleTranslation: 'Dùng đầu óc đi.', hint: '🧠' },
  { id: 'en_712', lang: 'en', term: 'breathe', phonetic: '/briːð/', translation: 'thở', level: 4, pos: 'động từ', example: 'Breathe deeply.', exampleTranslation: 'Hít thở sâu.', hint: '😮‍💨' },
  { id: 'en_713', lang: 'en', term: 'exercise', phonetic: '/ˈeksərsaɪz/', translation: 'tập thể dục', level: 4, pos: 'động từ', example: 'Exercise every day.', exampleTranslation: 'Tập mỗi ngày.', hint: '💪' },
  { id: 'en_714', lang: 'en', term: 'rest', phonetic: '/rest/', translation: 'nghỉ ngơi', level: 4, pos: 'động từ', example: 'Rest a little.', exampleTranslation: 'Nghỉ một chút.', hint: '😴' },

  // ─── More verbs (everyday) ──────────────────────────────────────────
  { id: 'en_715', lang: 'en', term: 'borrow', phonetic: '/ˈbɒroʊ/', translation: 'mượn', level: 4, pos: 'động từ', example: 'Can I borrow this?', exampleTranslation: 'Tôi mượn được không?', hint: '🤲' },
  { id: 'en_716', lang: 'en', term: 'lend', phonetic: '/lend/', translation: 'cho mượn', level: 4, pos: 'động từ', example: 'Lend me your pen.', exampleTranslation: 'Cho tôi mượn bút.', hint: '🤲' },
  { id: 'en_717', lang: 'en', term: 'share', phonetic: '/ʃer/', translation: 'chia sẻ', level: 4, pos: 'động từ', example: 'Share with friends.', exampleTranslation: 'Chia sẻ với bạn.', hint: '🤝' },
  { id: 'en_718', lang: 'en', term: 'wear', phonetic: '/wer/', translation: 'mặc', level: 4, pos: 'động từ', example: 'Wear a coat.', exampleTranslation: 'Mặc áo khoác.', hint: '🧥' },
  { id: 'en_719', lang: 'en', term: 'carry', phonetic: '/ˈkæri/', translation: 'mang/cầm', level: 4, pos: 'động từ', example: 'Carry the bag.', exampleTranslation: 'Cầm cái cặp.', hint: '🎒' },
  { id: 'en_720', lang: 'en', term: 'hold', phonetic: '/hoʊld/', translation: 'giữ', level: 4, pos: 'động từ', example: 'Hold my hand.', exampleTranslation: 'Nắm tay tôi.', hint: '🤝' },
  { id: 'en_721', lang: 'en', term: 'push', phonetic: '/pʊʃ/', translation: 'đẩy', level: 4, pos: 'động từ', example: 'Push the door.', exampleTranslation: 'Đẩy cửa đi.', hint: '👉' },
  { id: 'en_722', lang: 'en', term: 'pull', phonetic: '/pʊl/', translation: 'kéo', level: 4, pos: 'động từ', example: 'Pull the rope.', exampleTranslation: 'Kéo dây đi.', hint: '👈' },
  { id: 'en_723', lang: 'en', term: 'turn', phonetic: '/tɜːrn/', translation: 'rẽ/quay', level: 4, pos: 'động từ', example: 'Turn left here.', exampleTranslation: 'Rẽ trái ở đây.', hint: '🔄' },
  { id: 'en_724', lang: 'en', term: 'move', phonetic: '/muːv/', translation: 'di chuyển', level: 4, pos: 'động từ', example: 'Move the chair.', exampleTranslation: 'Di chuyển ghế.', hint: '➡️' },
  { id: 'en_725', lang: 'en', term: 'hide', phonetic: '/haɪd/', translation: 'trốn', level: 4, pos: 'động từ', example: 'Hide behind the tree.', exampleTranslation: 'Trốn sau cây.', hint: '🙈' },
  { id: 'en_726', lang: 'en', term: 'find', phonetic: '/faɪnd/', translation: 'tìm', level: 4, pos: 'động từ', example: 'Find the hidden ball.', exampleTranslation: 'Tìm quả bóng ẩn.', hint: '🔍' },
  { id: 'en_727', lang: 'en', term: 'climb', phonetic: '/klaɪm/', translation: 'leo', level: 4, pos: 'động từ', example: 'Climb up the stairs.', exampleTranslation: 'Leo cầu thang.', hint: '🪜' },
  { id: 'en_728', lang: 'en', term: 'fall', phonetic: '/fɔːl/', translation: 'ngã', level: 4, pos: 'động từ', example: 'Don\'t fall down.', exampleTranslation: 'Đừng ngã.', hint: '⬇️' },
  { id: 'en_729', lang: 'en', term: 'stand up', phonetic: '/stænd ʌp/', translation: 'đứng dậy', level: 4, pos: 'cụm động từ', example: 'Stand up, please.', exampleTranslation: 'Đứng dậy đi.', hint: '🧍' },
  { id: 'en_730', lang: 'en', term: 'sit down', phonetic: '/sɪt daʊn/', translation: 'ngồi xuống', level: 4, pos: 'cụm động từ', example: 'Sit down, please.', exampleTranslation: 'Ngồi xuống đi.', hint: '🪑' },

  // ─── More adjectives (descriptive) ──────────────────────────────────
  { id: 'en_731', lang: 'en', term: 'difficult', phonetic: '/ˈdɪfɪkəlt/', translation: 'khó khăn', level: 4, pos: 'tính từ', example: 'A difficult question.', exampleTranslation: 'Câu hỏi khó.', hint: '😰' },
  { id: 'en_732', lang: 'en', term: 'simple', phonetic: '/ˈsɪmpəl/', translation: 'đơn giản', level: 4, pos: 'tính từ', example: 'A simple game.', exampleTranslation: 'Trò đơn giản.', hint: '✨' },
  { id: 'en_733', lang: 'en', term: 'important', phonetic: '/ɪmˈpɔːrtənt/', translation: 'quan trọng', level: 4, pos: 'tính từ', example: 'School is important.', exampleTranslation: 'Trường học quan trọng.', hint: '⭐' },
  { id: 'en_734', lang: 'en', term: 'interesting', phonetic: '/ˈɪntrəstɪŋ/', translation: 'thú vị', level: 4, pos: 'tính từ', example: 'An interesting book.', exampleTranslation: 'Quyển sách thú vị.', hint: '🤔' },
  { id: 'en_735', lang: 'en', term: 'boring', phonetic: '/ˈbɔːrɪŋ/', translation: 'chán', level: 4, pos: 'tính từ', example: 'A boring movie.', exampleTranslation: 'Phim chán.', hint: '😑' },
  { id: 'en_736', lang: 'en', term: 'famous', phonetic: '/ˈfeɪməs/', translation: 'nổi tiếng', level: 4, pos: 'tính từ', example: 'A famous singer.', exampleTranslation: 'Ca sĩ nổi tiếng.', hint: '⭐' },
  { id: 'en_737', lang: 'en', term: 'special', phonetic: '/ˈspeʃəl/', translation: 'đặc biệt', level: 4, pos: 'tính từ', example: 'A special day.', exampleTranslation: 'Ngày đặc biệt.', hint: '🎁' },
  { id: 'en_738', lang: 'en', term: 'normal', phonetic: '/ˈnɔːrməl/', translation: 'bình thường', level: 4, pos: 'tính từ', example: 'A normal day.', exampleTranslation: 'Ngày bình thường.', hint: '➖' },
  { id: 'en_739', lang: 'en', term: 'safe', phonetic: '/seɪf/', translation: 'an toàn', level: 4, pos: 'tính từ', example: 'Stay safe.', exampleTranslation: 'Giữ an toàn.', hint: '🛡️' },
  { id: 'en_740', lang: 'en', term: 'dangerous', phonetic: '/ˈdeɪndʒərəs/', translation: 'nguy hiểm', level: 4, pos: 'tính từ', example: 'Fire is dangerous.', exampleTranslation: 'Lửa nguy hiểm.', hint: '⚠️' },
  { id: 'en_741', lang: 'en', term: 'careful', phonetic: '/ˈkerfəl/', translation: 'cẩn thận', level: 4, pos: 'tính từ', example: 'Be careful!', exampleTranslation: 'Cẩn thận!', hint: '⚠️' },
  { id: 'en_742', lang: 'en', term: 'quiet', phonetic: '/ˈkwaɪət/', translation: 'yên tĩnh', level: 4, pos: 'tính từ', example: 'A quiet room.', exampleTranslation: 'Phòng yên tĩnh.', hint: '🤫' },
  { id: 'en_743', lang: 'en', term: 'noisy', phonetic: '/ˈnɔɪzi/', translation: 'ồn ào', level: 4, pos: 'tính từ', example: 'A noisy class.', exampleTranslation: 'Lớp học ồn ào.', hint: '📢' },
  { id: 'en_744', lang: 'en', term: 'busy', phonetic: '/ˈbɪzi/', translation: 'bận', level: 4, pos: 'tính từ', example: 'Mom is busy.', exampleTranslation: 'Mẹ bận.', hint: '⏰' },
  { id: 'en_745', lang: 'en', term: 'free', phonetic: '/friː/', translation: 'rảnh/miễn phí', level: 4, pos: 'tính từ', example: 'I am free now.', exampleTranslation: 'Bây giờ tôi rảnh.', hint: '🆓' },

  // ─── Closing concepts ───────────────────────────────────────────────
  { id: 'en_746', lang: 'en', term: 'idea', phonetic: '/aɪˈdiːə/', translation: 'ý tưởng', level: 4, pos: 'danh từ', example: 'A great idea!', exampleTranslation: 'Ý hay!', hint: '💡' },
  { id: 'en_747', lang: 'en', term: 'plan', phonetic: '/plæn/', translation: 'kế hoạch', level: 4, pos: 'danh từ', example: 'A good plan.', exampleTranslation: 'Kế hoạch tốt.', hint: '📋' },
  { id: 'en_748', lang: 'en', term: 'reason', phonetic: '/ˈriːzən/', translation: 'lý do', level: 4, pos: 'danh từ', example: 'What\'s the reason?', exampleTranslation: 'Lý do là gì?', hint: '💭' },
  { id: 'en_749', lang: 'en', term: 'problem', phonetic: '/ˈprɒbləm/', translation: 'vấn đề', level: 4, pos: 'danh từ', example: 'A small problem.', exampleTranslation: 'Vấn đề nhỏ.', hint: '⚠️' },
  { id: 'en_750', lang: 'en', term: 'solution', phonetic: '/səˈluːʃən/', translation: 'giải pháp', level: 4, pos: 'danh từ', example: 'Find a solution.', exampleTranslation: 'Tìm giải pháp.', hint: '✅' },
];
