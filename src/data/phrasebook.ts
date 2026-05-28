/**
 * D-22: 300 common sentences (English + Chinese) for the "Mẫu câu" tab.
 * Each phrase carries a Vietnamese meaning, the English + Chinese sentence,
 * and pinyin for the Chinese. Grouped by everyday topics (incl. a dedicated
 * conditional-sentences group). Extend by adding to a category's `phrases`.
 */
export interface Phrase {
  id: string;       // stable id → audio cache key
  vi: string;
  en: string;
  zh: string;
  pinyin: string;
}
export interface PhraseCategory {
  id: string;
  title: string;
  emoji: string;
  phrases: Phrase[];
}

export const PHRASEBOOK: PhraseCategory[] = [
  {
    id: 'greetings', title: 'Chào hỏi', emoji: '👋',
    phrases: [
      { id: 'gr1', vi: 'Xin chào!', en: 'Hello!', zh: '你好！', pinyin: 'Nǐ hǎo!' },
      { id: 'gr2', vi: 'Chào buổi sáng.', en: 'Good morning.', zh: '早上好。', pinyin: 'Zǎoshang hǎo.' },
      { id: 'gr3', vi: 'Bạn khỏe không?', en: 'How are you?', zh: '你好吗？', pinyin: 'Nǐ hǎo ma?' },
      { id: 'gr4', vi: 'Tôi khỏe, cảm ơn.', en: 'I am fine, thank you.', zh: '我很好，谢谢。', pinyin: 'Wǒ hěn hǎo, xièxie.' },
      { id: 'gr5', vi: 'Rất vui được gặp bạn.', en: 'Nice to meet you.', zh: '很高兴认识你。', pinyin: 'Hěn gāoxìng rènshi nǐ.' },
      { id: 'gr6', vi: 'Hẹn gặp lại!', en: 'See you later!', zh: '再见！', pinyin: 'Zàijiàn!' },
      { id: 'gr7', vi: 'Chúc ngủ ngon.', en: 'Good night.', zh: '晚安。', pinyin: 'Wǎn’ān.' },
      { id: 'gr8', vi: 'Lâu rồi không gặp.', en: 'Long time no see.', zh: '好久不见。', pinyin: 'Hǎojiǔ bùjiàn.' },
    ],
  },
  {
    id: 'self', title: 'Giới thiệu bản thân', emoji: '🙋',
    phrases: [
      { id: 'sf1', vi: 'Tên tôi là Nam.', en: 'My name is Nam.', zh: '我叫南。', pinyin: 'Wǒ jiào Nán.' },
      { id: 'sf2', vi: 'Tôi đến từ Việt Nam.', en: 'I am from Vietnam.', zh: '我来自越南。', pinyin: 'Wǒ láizì Yuènán.' },
      { id: 'sf3', vi: 'Tôi mười tuổi.', en: 'I am ten years old.', zh: '我十岁。', pinyin: 'Wǒ shí suì.' },
      { id: 'sf4', vi: 'Tôi là học sinh.', en: 'I am a student.', zh: '我是学生。', pinyin: 'Wǒ shì xuésheng.' },
      { id: 'sf5', vi: 'Tôi đang học tiếng Anh.', en: 'I am learning English.', zh: '我在学英语。', pinyin: 'Wǒ zài xué Yīngyǔ.' },
      { id: 'sf6', vi: 'Tôi thích đọc sách.', en: 'I like reading books.', zh: '我喜欢看书。', pinyin: 'Wǒ xǐhuan kàn shū.' },
      { id: 'sf7', vi: 'Sở thích của tôi là vẽ.', en: 'My hobby is drawing.', zh: '我的爱好是画画。', pinyin: 'Wǒ de àihào shì huàhuà.' },
    ],
  },
  {
    id: 'family', title: 'Gia đình', emoji: '👨‍👩‍👧',
    phrases: [
      { id: 'fa1', vi: 'Đây là gia đình tôi.', en: 'This is my family.', zh: '这是我的家。', pinyin: 'Zhè shì wǒ de jiā.' },
      { id: 'fa2', vi: 'Tôi có một anh trai.', en: 'I have an older brother.', zh: '我有一个哥哥。', pinyin: 'Wǒ yǒu yí ge gēge.' },
      { id: 'fa3', vi: 'Bố tôi là bác sĩ.', en: 'My father is a doctor.', zh: '我爸爸是医生。', pinyin: 'Wǒ bàba shì yīshēng.' },
      { id: 'fa4', vi: 'Mẹ tôi nấu ăn rất ngon.', en: 'My mother cooks very well.', zh: '我妈妈做饭很好吃。', pinyin: 'Wǒ māma zuòfàn hěn hǎochī.' },
      { id: 'fa5', vi: 'Tôi yêu gia đình tôi.', en: 'I love my family.', zh: '我爱我的家人。', pinyin: 'Wǒ ài wǒ de jiārén.' },
      { id: 'fa6', vi: 'Chúng tôi sống cùng nhau.', en: 'We live together.', zh: '我们住在一起。', pinyin: 'Wǒmen zhù zài yìqǐ.' },
    ],
  },
  {
    id: 'time', title: 'Số & thời gian', emoji: '🕐',
    phrases: [
      { id: 'ti1', vi: 'Bây giờ là mấy giờ?', en: 'What time is it now?', zh: '现在几点？', pinyin: 'Xiànzài jǐ diǎn?' },
      { id: 'ti2', vi: 'Bây giờ là tám giờ.', en: 'It is eight o’clock.', zh: '现在八点。', pinyin: 'Xiànzài bā diǎn.' },
      { id: 'ti3', vi: 'Hôm nay là thứ Hai.', en: 'Today is Monday.', zh: '今天是星期一。', pinyin: 'Jīntiān shì xīngqīyī.' },
      { id: 'ti4', vi: 'Ngày mai tôi đi học.', en: 'Tomorrow I go to school.', zh: '明天我去上学。', pinyin: 'Míngtiān wǒ qù shàngxué.' },
      { id: 'ti5', vi: 'Tôi dậy lúc sáu giờ.', en: 'I get up at six.', zh: '我六点起床。', pinyin: 'Wǒ liù diǎn qǐchuáng.' },
      { id: 'ti6', vi: 'Có bao nhiêu cái?', en: 'How many are there?', zh: '有几个？', pinyin: 'Yǒu jǐ ge?' },
    ],
  },
  {
    id: 'food', title: 'Ăn uống', emoji: '🍜',
    phrases: [
      { id: 'fo1', vi: 'Tôi đói rồi.', en: 'I am hungry.', zh: '我饿了。', pinyin: 'Wǒ è le.' },
      { id: 'fo2', vi: 'Tôi muốn uống nước.', en: 'I want to drink water.', zh: '我想喝水。', pinyin: 'Wǒ xiǎng hē shuǐ.' },
      { id: 'fo3', vi: 'Món này rất ngon.', en: 'This dish is delicious.', zh: '这个菜很好吃。', pinyin: 'Zhège cài hěn hǎochī.' },
      { id: 'fo4', vi: 'Cho tôi một bát cơm.', en: 'A bowl of rice, please.', zh: '请给我一碗米饭。', pinyin: 'Qǐng gěi wǒ yì wǎn mǐfàn.' },
      { id: 'fo5', vi: 'Tôi thích ăn trái cây.', en: 'I like eating fruit.', zh: '我喜欢吃水果。', pinyin: 'Wǒ xǐhuan chī shuǐguǒ.' },
      { id: 'fo6', vi: 'Tính tiền nhé.', en: 'The bill, please.', zh: '买单。', pinyin: 'Mǎidān.' },
    ],
  },
  {
    id: 'shopping', title: 'Mua sắm', emoji: '🛍️',
    phrases: [
      { id: 'sh1', vi: 'Cái này bao nhiêu tiền?', en: 'How much is this?', zh: '这个多少钱？', pinyin: 'Zhège duōshǎo qián?' },
      { id: 'sh2', vi: 'Đắt quá!', en: 'It is too expensive!', zh: '太贵了！', pinyin: 'Tài guì le!' },
      { id: 'sh3', vi: 'Tôi muốn mua cái này.', en: 'I want to buy this.', zh: '我想买这个。', pinyin: 'Wǒ xiǎng mǎi zhège.' },
      { id: 'sh4', vi: 'Có màu khác không?', en: 'Do you have another color?', zh: '有别的颜色吗？', pinyin: 'Yǒu bié de yánsè ma?' },
      { id: 'sh5', vi: 'Tôi chỉ xem thôi.', en: 'I am just looking.', zh: '我只是看看。', pinyin: 'Wǒ zhǐshì kànkan.' },
    ],
  },
  {
    id: 'travel', title: 'Đi lại & du lịch', emoji: '✈️',
    phrases: [
      { id: 'tr1', vi: 'Nhà vệ sinh ở đâu?', en: 'Where is the toilet?', zh: '洗手间在哪儿？', pinyin: 'Xǐshǒujiān zài nǎr?' },
      { id: 'tr2', vi: 'Tôi muốn đi sân bay.', en: 'I want to go to the airport.', zh: '我想去机场。', pinyin: 'Wǒ xiǎng qù jīchǎng.' },
      { id: 'tr3', vi: 'Bao xa từ đây?', en: 'How far is it from here?', zh: '离这儿多远？', pinyin: 'Lí zhèr duō yuǎn?' },
      { id: 'tr4', vi: 'Tôi bị lạc đường.', en: 'I am lost.', zh: '我迷路了。', pinyin: 'Wǒ mílù le.' },
      { id: 'tr5', vi: 'Xe buýt đến lúc mấy giờ?', en: 'What time does the bus come?', zh: '公共汽车几点来？', pinyin: 'Gōnggòng qìchē jǐ diǎn lái?' },
    ],
  },
  {
    id: 'weather', title: 'Thời tiết', emoji: '🌤️',
    phrases: [
      { id: 'we1', vi: 'Hôm nay trời đẹp.', en: 'The weather is nice today.', zh: '今天天气很好。', pinyin: 'Jīntiān tiānqì hěn hǎo.' },
      { id: 'we2', vi: 'Trời đang mưa.', en: 'It is raining.', zh: '正在下雨。', pinyin: 'Zhèngzài xià yǔ.' },
      { id: 'we3', vi: 'Trời lạnh quá.', en: 'It is very cold.', zh: '太冷了。', pinyin: 'Tài lěng le.' },
      { id: 'we4', vi: 'Ngày mai trời sẽ nắng.', en: 'It will be sunny tomorrow.', zh: '明天会是晴天。', pinyin: 'Míngtiān huì shì qíngtiān.' },
    ],
  },
  {
    id: 'school', title: 'Trường & công việc', emoji: '🏫',
    phrases: [
      { id: 'sc1', vi: 'Tôi đi học mỗi ngày.', en: 'I go to school every day.', zh: '我每天上学。', pinyin: 'Wǒ měitiān shàngxué.' },
      { id: 'sc2', vi: 'Tôi có nhiều bài tập.', en: 'I have a lot of homework.', zh: '我有很多作业。', pinyin: 'Wǒ yǒu hěn duō zuòyè.' },
      { id: 'sc3', vi: 'Thầy giáo rất tốt bụng.', en: 'The teacher is very kind.', zh: '老师很好。', pinyin: 'Lǎoshī hěn hǎo.' },
      { id: 'sc4', vi: 'Tôi học chăm chỉ.', en: 'I study hard.', zh: '我努力学习。', pinyin: 'Wǒ nǔlì xuéxí.' },
    ],
  },
  {
    id: 'feelings', title: 'Cảm xúc', emoji: '😊',
    phrases: [
      { id: 'fe1', vi: 'Tôi rất vui.', en: 'I am very happy.', zh: '我很开心。', pinyin: 'Wǒ hěn kāixīn.' },
      { id: 'fe2', vi: 'Tôi hơi mệt.', en: 'I am a little tired.', zh: '我有点累。', pinyin: 'Wǒ yǒudiǎn lèi.' },
      { id: 'fe3', vi: 'Tôi nhớ bạn.', en: 'I miss you.', zh: '我想你。', pinyin: 'Wǒ xiǎng nǐ.' },
      { id: 'fe4', vi: 'Đừng lo lắng.', en: 'Don’t worry.', zh: '别担心。', pinyin: 'Bié dānxīn.' },
    ],
  },
  {
    id: 'polite', title: 'Yêu cầu lịch sự', emoji: '🙏',
    phrases: [
      { id: 'po1', vi: 'Làm ơn giúp tôi.', en: 'Please help me.', zh: '请帮帮我。', pinyin: 'Qǐng bāngbang wǒ.' },
      { id: 'po2', vi: 'Cảm ơn rất nhiều.', en: 'Thank you very much.', zh: '非常感谢。', pinyin: 'Fēicháng gǎnxiè.' },
      { id: 'po3', vi: 'Xin lỗi.', en: 'I am sorry.', zh: '对不起。', pinyin: 'Duìbuqǐ.' },
      { id: 'po4', vi: 'Không sao đâu.', en: 'It’s okay.', zh: '没关系。', pinyin: 'Méi guānxi.' },
      { id: 'po5', vi: 'Bạn nói lại được không?', en: 'Could you say that again?', zh: '你能再说一遍吗？', pinyin: 'Nǐ néng zài shuō yí biàn ma?' },
    ],
  },
  {
    id: 'conditional', title: 'Câu điều kiện', emoji: '🔀',
    phrases: [
      { id: 'co1', vi: 'Nếu trời mưa, tôi sẽ ở nhà.', en: 'If it rains, I will stay home.', zh: '如果下雨，我就待在家里。', pinyin: 'Rúguǒ xià yǔ, wǒ jiù dāi zài jiā lǐ.' },
      { id: 'co2', vi: 'Nếu bạn rảnh, hãy gọi tôi.', en: 'If you are free, call me.', zh: '如果你有空，就给我打电话。', pinyin: 'Rúguǒ nǐ yǒu kòng, jiù gěi wǒ dǎ diànhuà.' },
      { id: 'co3', vi: 'Nếu tôi có tiền, tôi sẽ đi du lịch.', en: 'If I had money, I would travel.', zh: '如果我有钱，我就去旅行。', pinyin: 'Rúguǒ wǒ yǒu qián, wǒ jiù qù lǚxíng.' },
      { id: 'co4', vi: 'Nếu chăm học, bạn sẽ thi đậu.', en: 'If you study hard, you will pass the exam.', zh: '如果努力学习，你就会通过考试。', pinyin: 'Rúguǒ nǔlì xuéxí, nǐ jiù huì tōngguò kǎoshì.' },
      { id: 'co5', vi: 'Khi nào rảnh, tôi sẽ đọc sách.', en: 'When I am free, I read books.', zh: '有空的时候，我会看书。', pinyin: 'Yǒu kòng de shíhou, wǒ huì kàn shū.' },
    ],
  },
];

/** Worker audio key for a phrase in a given language (zh/ prefix → Qwen TTS). */
export function phraseAudioKey(lang: 'en' | 'zh', id: string): string {
  return lang === 'zh' ? `zh/phrasebook/${id}.mp3` : `phrasebook/${id}.mp3`;
}
