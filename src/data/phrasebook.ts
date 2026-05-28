/**
 * D-22: common sentences (English + Chinese) for the "Mẫu câu" tab.
 * Each phrase carries a Vietnamese meaning, the English + Chinese sentence,
 * and pinyin. Grouped by everyday topics (incl. a dedicated conditional-
 * sentences group). Extend by adding to a category's `phrases`.
 *
 * Initial corpus targets ~300 phrases across ~24 categories.
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
  // ── 1. Chào hỏi ──
  { id: 'greetings', title: 'Chào hỏi', emoji: '👋', phrases: [
    { id: 'gr1', vi: 'Xin chào!', en: 'Hello!', zh: '你好！', pinyin: 'Nǐ hǎo!' },
    { id: 'gr2', vi: 'Chào buổi sáng.', en: 'Good morning.', zh: '早上好。', pinyin: 'Zǎoshang hǎo.' },
    { id: 'gr3', vi: 'Chào buổi chiều.', en: 'Good afternoon.', zh: '下午好。', pinyin: 'Xiàwǔ hǎo.' },
    { id: 'gr4', vi: 'Chào buổi tối.', en: 'Good evening.', zh: '晚上好。', pinyin: 'Wǎnshang hǎo.' },
    { id: 'gr5', vi: 'Bạn khỏe không?', en: 'How are you?', zh: '你好吗？', pinyin: 'Nǐ hǎo ma?' },
    { id: 'gr6', vi: 'Tôi khỏe, cảm ơn.', en: 'I am fine, thank you.', zh: '我很好，谢谢。', pinyin: 'Wǒ hěn hǎo, xièxie.' },
    { id: 'gr7', vi: 'Rất vui được gặp bạn.', en: 'Nice to meet you.', zh: '很高兴认识你。', pinyin: 'Hěn gāoxìng rènshi nǐ.' },
    { id: 'gr8', vi: 'Hẹn gặp lại!', en: 'See you later!', zh: '再见！', pinyin: 'Zàijiàn!' },
    { id: 'gr9', vi: 'Hẹn gặp ngày mai.', en: 'See you tomorrow.', zh: '明天见。', pinyin: 'Míngtiān jiàn.' },
    { id: 'gr10', vi: 'Chúc ngủ ngon.', en: 'Good night.', zh: '晚安。', pinyin: 'Wǎn’ān.' },
    { id: 'gr11', vi: 'Lâu rồi không gặp.', en: 'Long time no see.', zh: '好久不见。', pinyin: 'Hǎojiǔ bùjiàn.' },
    { id: 'gr12', vi: 'Bạn dạo này thế nào?', en: 'How have you been?', zh: '你最近怎么样？', pinyin: 'Nǐ zuìjìn zěnmeyàng?' },
  ]},

  // ── 2. Giới thiệu bản thân ──
  { id: 'self', title: 'Giới thiệu bản thân', emoji: '🙋', phrases: [
    { id: 'sf1', vi: 'Tên tôi là Nam.', en: 'My name is Nam.', zh: '我叫南。', pinyin: 'Wǒ jiào Nán.' },
    { id: 'sf2', vi: 'Tôi đến từ Việt Nam.', en: 'I am from Vietnam.', zh: '我来自越南。', pinyin: 'Wǒ láizì Yuènán.' },
    { id: 'sf3', vi: 'Tôi mười tuổi.', en: 'I am ten years old.', zh: '我十岁。', pinyin: 'Wǒ shí suì.' },
    { id: 'sf4', vi: 'Tôi là học sinh.', en: 'I am a student.', zh: '我是学生。', pinyin: 'Wǒ shì xuésheng.' },
    { id: 'sf5', vi: 'Tôi đang học tiếng Anh.', en: 'I am learning English.', zh: '我在学英语。', pinyin: 'Wǒ zài xué Yīngyǔ.' },
    { id: 'sf6', vi: 'Tôi thích đọc sách.', en: 'I like reading books.', zh: '我喜欢看书。', pinyin: 'Wǒ xǐhuan kàn shū.' },
    { id: 'sf7', vi: 'Sở thích của tôi là vẽ.', en: 'My hobby is drawing.', zh: '我的爱好是画画。', pinyin: 'Wǒ de àihào shì huàhuà.' },
    { id: 'sf8', vi: 'Tôi sống ở Hà Nội.', en: 'I live in Hanoi.', zh: '我住在河内。', pinyin: 'Wǒ zhù zài Hénèi.' },
    { id: 'sf9', vi: 'Tôi làm việc ở văn phòng.', en: 'I work in an office.', zh: '我在办公室工作。', pinyin: 'Wǒ zài bàngōngshì gōngzuò.' },
    { id: 'sf10', vi: 'Sinh nhật tôi tháng Năm.', en: 'My birthday is in May.', zh: '我的生日在五月。', pinyin: 'Wǒ de shēngrì zài wǔyuè.' },
  ]},

  // ── 3. Gia đình ──
  { id: 'family', title: 'Gia đình', emoji: '👨‍👩‍👧', phrases: [
    { id: 'fa1', vi: 'Đây là gia đình tôi.', en: 'This is my family.', zh: '这是我的家。', pinyin: 'Zhè shì wǒ de jiā.' },
    { id: 'fa2', vi: 'Tôi có một anh trai.', en: 'I have an older brother.', zh: '我有一个哥哥。', pinyin: 'Wǒ yǒu yí ge gēge.' },
    { id: 'fa3', vi: 'Tôi có một em gái.', en: 'I have a younger sister.', zh: '我有一个妹妹。', pinyin: 'Wǒ yǒu yí ge mèimei.' },
    { id: 'fa4', vi: 'Bố tôi là bác sĩ.', en: 'My father is a doctor.', zh: '我爸爸是医生。', pinyin: 'Wǒ bàba shì yīshēng.' },
    { id: 'fa5', vi: 'Mẹ tôi là giáo viên.', en: 'My mother is a teacher.', zh: '我妈妈是老师。', pinyin: 'Wǒ māma shì lǎoshī.' },
    { id: 'fa6', vi: 'Mẹ tôi nấu ăn rất ngon.', en: 'My mother cooks very well.', zh: '我妈妈做饭很好吃。', pinyin: 'Wǒ māma zuòfàn hěn hǎochī.' },
    { id: 'fa7', vi: 'Tôi yêu gia đình tôi.', en: 'I love my family.', zh: '我爱我的家人。', pinyin: 'Wǒ ài wǒ de jiārén.' },
    { id: 'fa8', vi: 'Chúng tôi sống cùng nhau.', en: 'We live together.', zh: '我们住在一起。', pinyin: 'Wǒmen zhù zài yìqǐ.' },
    { id: 'fa9', vi: 'Ông bà tôi rất khỏe mạnh.', en: 'My grandparents are very healthy.', zh: '我的爷爷奶奶很健康。', pinyin: 'Wǒ de yéye nǎinai hěn jiànkāng.' },
    { id: 'fa10', vi: 'Cuối tuần chúng tôi ăn cơm cùng nhau.', en: 'On weekends we eat together.', zh: '周末我们一起吃饭。', pinyin: 'Zhōumò wǒmen yìqǐ chīfàn.' },
  ]},

  // ── 4. Số đếm ──
  { id: 'numbers', title: 'Số đếm', emoji: '🔢', phrases: [
    { id: 'nu1', vi: 'Một, hai, ba.', en: 'One, two, three.', zh: '一、二、三。', pinyin: 'Yī, èr, sān.' },
    { id: 'nu2', vi: 'Bốn, năm, sáu.', en: 'Four, five, six.', zh: '四、五、六。', pinyin: 'Sì, wǔ, liù.' },
    { id: 'nu3', vi: 'Bảy, tám, chín, mười.', en: 'Seven, eight, nine, ten.', zh: '七、八、九、十。', pinyin: 'Qī, bā, jiǔ, shí.' },
    { id: 'nu4', vi: 'Có bao nhiêu cái?', en: 'How many are there?', zh: '有几个？', pinyin: 'Yǒu jǐ ge?' },
    { id: 'nu5', vi: 'Hai mươi học sinh.', en: 'Twenty students.', zh: '二十个学生。', pinyin: 'Èrshí ge xuésheng.' },
    { id: 'nu6', vi: 'Một trăm đồng.', en: 'One hundred yuan.', zh: '一百块。', pinyin: 'Yìbǎi kuài.' },
    { id: 'nu7', vi: 'Số điện thoại của bạn là gì?', en: 'What is your phone number?', zh: '你的电话号码是多少？', pinyin: 'Nǐ de diànhuà hàomǎ shì duōshǎo?' },
    { id: 'nu8', vi: 'Tôi là người thứ ba.', en: 'I am the third one.', zh: '我是第三个。', pinyin: 'Wǒ shì dì sān ge.' },
  ]},

  // ── 5. Thời gian ──
  { id: 'time', title: 'Thời gian', emoji: '🕐', phrases: [
    { id: 'ti1', vi: 'Bây giờ là mấy giờ?', en: 'What time is it now?', zh: '现在几点？', pinyin: 'Xiànzài jǐ diǎn?' },
    { id: 'ti2', vi: 'Bây giờ là tám giờ.', en: 'It is eight o’clock.', zh: '现在八点。', pinyin: 'Xiànzài bā diǎn.' },
    { id: 'ti3', vi: 'Tám giờ rưỡi.', en: 'Half past eight.', zh: '八点半。', pinyin: 'Bā diǎn bàn.' },
    { id: 'ti4', vi: 'Hôm nay là thứ Hai.', en: 'Today is Monday.', zh: '今天是星期一。', pinyin: 'Jīntiān shì xīngqīyī.' },
    { id: 'ti5', vi: 'Hôm nay ngày bao nhiêu?', en: 'What is the date today?', zh: '今天几号？', pinyin: 'Jīntiān jǐ hào?' },
    { id: 'ti6', vi: 'Ngày mai tôi đi học.', en: 'Tomorrow I go to school.', zh: '明天我去上学。', pinyin: 'Míngtiān wǒ qù shàngxué.' },
    { id: 'ti7', vi: 'Hôm qua tôi ở nhà.', en: 'Yesterday I stayed home.', zh: '昨天我在家。', pinyin: 'Zuótiān wǒ zài jiā.' },
    { id: 'ti8', vi: 'Tôi dậy lúc sáu giờ.', en: 'I get up at six.', zh: '我六点起床。', pinyin: 'Wǒ liù diǎn qǐchuáng.' },
    { id: 'ti9', vi: 'Tôi đi ngủ lúc mười giờ.', en: 'I go to bed at ten.', zh: '我十点睡觉。', pinyin: 'Wǒ shí diǎn shuìjiào.' },
    { id: 'ti10', vi: 'Một lát nữa gặp.', en: 'See you in a minute.', zh: '一会儿见。', pinyin: 'Yíhuìr jiàn.' },
  ]},

  // ── 6. Ăn uống ──
  { id: 'food', title: 'Ăn uống', emoji: '🍜', phrases: [
    { id: 'fo1', vi: 'Tôi đói rồi.', en: 'I am hungry.', zh: '我饿了。', pinyin: 'Wǒ è le.' },
    { id: 'fo2', vi: 'Tôi khát nước.', en: 'I am thirsty.', zh: '我渴了。', pinyin: 'Wǒ kě le.' },
    { id: 'fo3', vi: 'Tôi muốn uống nước.', en: 'I want to drink water.', zh: '我想喝水。', pinyin: 'Wǒ xiǎng hē shuǐ.' },
    { id: 'fo4', vi: 'Món này rất ngon.', en: 'This dish is delicious.', zh: '这个菜很好吃。', pinyin: 'Zhège cài hěn hǎochī.' },
    { id: 'fo5', vi: 'Cho tôi một bát cơm.', en: 'A bowl of rice, please.', zh: '请给我一碗米饭。', pinyin: 'Qǐng gěi wǒ yì wǎn mǐfàn.' },
    { id: 'fo6', vi: 'Tôi thích ăn trái cây.', en: 'I like eating fruit.', zh: '我喜欢吃水果。', pinyin: 'Wǒ xǐhuan chī shuǐguǒ.' },
    { id: 'fo7', vi: 'Tôi ăn chay.', en: 'I am vegetarian.', zh: '我吃素。', pinyin: 'Wǒ chī sù.' },
    { id: 'fo8', vi: 'Đừng cho ớt.', en: 'No chili, please.', zh: '请不要放辣椒。', pinyin: 'Qǐng búyào fàng làjiāo.' },
    { id: 'fo9', vi: 'Tính tiền nhé.', en: 'The bill, please.', zh: '买单。', pinyin: 'Mǎidān.' },
    { id: 'fo10', vi: 'Ngon miệng nhé!', en: 'Enjoy your meal!', zh: '请慢用！', pinyin: 'Qǐng màn yòng!' },
  ]},

  // ── 7. Mua sắm ──
  { id: 'shopping', title: 'Mua sắm', emoji: '🛍️', phrases: [
    { id: 'sh1', vi: 'Cái này bao nhiêu tiền?', en: 'How much is this?', zh: '这个多少钱？', pinyin: 'Zhège duōshǎo qián?' },
    { id: 'sh2', vi: 'Đắt quá!', en: 'It is too expensive!', zh: '太贵了！', pinyin: 'Tài guì le!' },
    { id: 'sh3', vi: 'Có thể giảm giá không?', en: 'Can you give a discount?', zh: '可以便宜点吗？', pinyin: 'Kěyǐ piányi diǎn ma?' },
    { id: 'sh4', vi: 'Tôi muốn mua cái này.', en: 'I want to buy this.', zh: '我想买这个。', pinyin: 'Wǒ xiǎng mǎi zhège.' },
    { id: 'sh5', vi: 'Có màu khác không?', en: 'Do you have another color?', zh: '有别的颜色吗？', pinyin: 'Yǒu bié de yánsè ma?' },
    { id: 'sh6', vi: 'Tôi chỉ xem thôi.', en: 'I am just looking.', zh: '我只是看看。', pinyin: 'Wǒ zhǐshì kànkan.' },
    { id: 'sh7', vi: 'Tôi trả bằng thẻ.', en: 'I will pay by card.', zh: '我用卡付钱。', pinyin: 'Wǒ yòng kǎ fùqián.' },
    { id: 'sh8', vi: 'Cho tôi cái khác.', en: 'Please give me another one.', zh: '请给我另一个。', pinyin: 'Qǐng gěi wǒ lìng yí ge.' },
    { id: 'sh9', vi: 'Có cỡ lớn hơn không?', en: 'Do you have a bigger size?', zh: '有大一点的吗？', pinyin: 'Yǒu dà yìdiǎn de ma?' },
  ]},

  // ── 8. Đi lại & du lịch ──
  { id: 'travel', title: 'Đi lại & du lịch', emoji: '✈️', phrases: [
    { id: 'tr1', vi: 'Nhà vệ sinh ở đâu?', en: 'Where is the toilet?', zh: '洗手间在哪儿？', pinyin: 'Xǐshǒujiān zài nǎr?' },
    { id: 'tr2', vi: 'Tôi muốn đi sân bay.', en: 'I want to go to the airport.', zh: '我想去机场。', pinyin: 'Wǒ xiǎng qù jīchǎng.' },
    { id: 'tr3', vi: 'Bao xa từ đây?', en: 'How far is it from here?', zh: '离这儿多远？', pinyin: 'Lí zhèr duō yuǎn?' },
    { id: 'tr4', vi: 'Tôi bị lạc đường.', en: 'I am lost.', zh: '我迷路了。', pinyin: 'Wǒ mílù le.' },
    { id: 'tr5', vi: 'Xe buýt đến lúc mấy giờ?', en: 'What time does the bus come?', zh: '公共汽车几点来？', pinyin: 'Gōnggòng qìchē jǐ diǎn lái?' },
    { id: 'tr6', vi: 'Có thể giúp tôi không?', en: 'Can you help me?', zh: '你能帮我吗？', pinyin: 'Nǐ néng bāng wǒ ma?' },
    { id: 'tr7', vi: 'Tôi cần một chiếc taxi.', en: 'I need a taxi.', zh: '我需要一辆出租车。', pinyin: 'Wǒ xūyào yí liàng chūzūchē.' },
    { id: 'tr8', vi: 'Đi thẳng rồi rẽ trái.', en: 'Go straight then turn left.', zh: '一直走然后向左拐。', pinyin: 'Yìzhí zǒu ránhòu xiàng zuǒ guǎi.' },
    { id: 'tr9', vi: 'Khách sạn gần đây không?', en: 'Is the hotel nearby?', zh: '酒店在附近吗？', pinyin: 'Jiǔdiàn zài fùjìn ma?' },
    { id: 'tr10', vi: 'Cho tôi một vé.', en: 'One ticket, please.', zh: '请给我一张票。', pinyin: 'Qǐng gěi wǒ yì zhāng piào.' },
  ]},

  // ── 9. Thời tiết ──
  { id: 'weather', title: 'Thời tiết', emoji: '🌤️', phrases: [
    { id: 'we1', vi: 'Hôm nay trời đẹp.', en: 'The weather is nice today.', zh: '今天天气很好。', pinyin: 'Jīntiān tiānqì hěn hǎo.' },
    { id: 'we2', vi: 'Trời đang mưa.', en: 'It is raining.', zh: '正在下雨。', pinyin: 'Zhèngzài xià yǔ.' },
    { id: 'we3', vi: 'Trời lạnh quá.', en: 'It is very cold.', zh: '太冷了。', pinyin: 'Tài lěng le.' },
    { id: 'we4', vi: 'Trời nóng quá.', en: 'It is too hot.', zh: '太热了。', pinyin: 'Tài rè le.' },
    { id: 'we5', vi: 'Ngày mai trời sẽ nắng.', en: 'It will be sunny tomorrow.', zh: '明天会是晴天。', pinyin: 'Míngtiān huì shì qíngtiān.' },
    { id: 'we6', vi: 'Cuối tuần có thể có tuyết.', en: 'It might snow this weekend.', zh: '周末可能会下雪。', pinyin: 'Zhōumò kěnéng huì xià xuě.' },
    { id: 'we7', vi: 'Đừng quên mang ô.', en: 'Don’t forget to bring an umbrella.', zh: '别忘了带伞。', pinyin: 'Bié wàng le dài sǎn.' },
    { id: 'we8', vi: 'Trời rất ấm áp.', en: 'It is very warm.', zh: '很暖和。', pinyin: 'Hěn nuǎnhuo.' },
  ]},

  // ── 10. Trường & công việc ──
  { id: 'school', title: 'Trường & công việc', emoji: '🏫', phrases: [
    { id: 'sc1', vi: 'Tôi đi học mỗi ngày.', en: 'I go to school every day.', zh: '我每天上学。', pinyin: 'Wǒ měitiān shàngxué.' },
    { id: 'sc2', vi: 'Tôi có nhiều bài tập.', en: 'I have a lot of homework.', zh: '我有很多作业。', pinyin: 'Wǒ yǒu hěn duō zuòyè.' },
    { id: 'sc3', vi: 'Thầy giáo rất tốt bụng.', en: 'The teacher is very kind.', zh: '老师很好。', pinyin: 'Lǎoshī hěn hǎo.' },
    { id: 'sc4', vi: 'Tôi học chăm chỉ.', en: 'I study hard.', zh: '我努力学习。', pinyin: 'Wǒ nǔlì xuéxí.' },
    { id: 'sc5', vi: 'Bạn học môn gì?', en: 'What subject do you study?', zh: '你学什么？', pinyin: 'Nǐ xué shénme?' },
    { id: 'sc6', vi: 'Tôi học toán và tiếng Anh.', en: 'I study math and English.', zh: '我学数学和英语。', pinyin: 'Wǒ xué shùxué hé Yīngyǔ.' },
    { id: 'sc7', vi: 'Hôm nay có một bài kiểm tra.', en: 'There is a test today.', zh: '今天有一个考试。', pinyin: 'Jīntiān yǒu yí ge kǎoshì.' },
    { id: 'sc8', vi: 'Tôi đã vượt qua kỳ thi.', en: 'I passed the exam.', zh: '我通过了考试。', pinyin: 'Wǒ tōngguò le kǎoshì.' },
    { id: 'sc9', vi: 'Công việc của tôi rất bận.', en: 'My job is very busy.', zh: '我的工作很忙。', pinyin: 'Wǒ de gōngzuò hěn máng.' },
    { id: 'sc10', vi: 'Tôi tan làm lúc năm giờ.', en: 'I finish work at five.', zh: '我五点下班。', pinyin: 'Wǒ wǔ diǎn xiàbān.' },
  ]},

  // ── 11. Cảm xúc ──
  { id: 'feelings', title: 'Cảm xúc', emoji: '😊', phrases: [
    { id: 'fe1', vi: 'Tôi rất vui.', en: 'I am very happy.', zh: '我很开心。', pinyin: 'Wǒ hěn kāixīn.' },
    { id: 'fe2', vi: 'Tôi hơi mệt.', en: 'I am a little tired.', zh: '我有点累。', pinyin: 'Wǒ yǒudiǎn lèi.' },
    { id: 'fe3', vi: 'Tôi nhớ bạn.', en: 'I miss you.', zh: '我想你。', pinyin: 'Wǒ xiǎng nǐ.' },
    { id: 'fe4', vi: 'Đừng lo lắng.', en: 'Don’t worry.', zh: '别担心。', pinyin: 'Bié dānxīn.' },
    { id: 'fe5', vi: 'Tôi đang buồn.', en: 'I am feeling sad.', zh: '我很难过。', pinyin: 'Wǒ hěn nánguò.' },
    { id: 'fe6', vi: 'Tôi bị căng thẳng.', en: 'I am stressed.', zh: '我很紧张。', pinyin: 'Wǒ hěn jǐnzhāng.' },
    { id: 'fe7', vi: 'Tôi cảm thấy thoải mái.', en: 'I feel relaxed.', zh: '我感觉很放松。', pinyin: 'Wǒ gǎnjué hěn fàngsōng.' },
    { id: 'fe8', vi: 'Hôm nay tôi tự hào về bạn.', en: 'I am proud of you today.', zh: '今天我为你感到骄傲。', pinyin: 'Jīntiān wǒ wèi nǐ gǎndào jiāo’ào.' },
  ]},

  // ── 12. Yêu cầu lịch sự ──
  { id: 'polite', title: 'Yêu cầu lịch sự', emoji: '🙏', phrases: [
    { id: 'po1', vi: 'Làm ơn giúp tôi.', en: 'Please help me.', zh: '请帮帮我。', pinyin: 'Qǐng bāngbang wǒ.' },
    { id: 'po2', vi: 'Cảm ơn rất nhiều.', en: 'Thank you very much.', zh: '非常感谢。', pinyin: 'Fēicháng gǎnxiè.' },
    { id: 'po3', vi: 'Xin lỗi.', en: 'I am sorry.', zh: '对不起。', pinyin: 'Duìbuqǐ.' },
    { id: 'po4', vi: 'Không sao đâu.', en: 'It’s okay.', zh: '没关系。', pinyin: 'Méi guānxi.' },
    { id: 'po5', vi: 'Bạn nói lại được không?', en: 'Could you say that again?', zh: '你能再说一遍吗？', pinyin: 'Nǐ néng zài shuō yí biàn ma?' },
    { id: 'po6', vi: 'Nói chậm hơn được không?', en: 'Could you speak more slowly?', zh: '你能说慢一点吗？', pinyin: 'Nǐ néng shuō màn yìdiǎn ma?' },
    { id: 'po7', vi: 'Tôi không hiểu.', en: 'I don’t understand.', zh: '我不明白。', pinyin: 'Wǒ bù míngbai.' },
    { id: 'po8', vi: 'Cảm ơn vì đã giúp.', en: 'Thanks for your help.', zh: '谢谢你的帮助。', pinyin: 'Xièxie nǐ de bāngzhù.' },
    { id: 'po9', vi: 'Không có chi.', en: 'You are welcome.', zh: '不客气。', pinyin: 'Bú kèqi.' },
  ]},

  // ── 13. Hỏi đường ──
  { id: 'directions', title: 'Hỏi đường', emoji: '🧭', phrases: [
    { id: 'di1', vi: 'Đường này đi đâu?', en: 'Where does this road go?', zh: '这条路通向哪里？', pinyin: 'Zhè tiáo lù tōng xiàng nǎlǐ?' },
    { id: 'di2', vi: 'Rẽ phải ở ngã tư.', en: 'Turn right at the intersection.', zh: '在十字路口右拐。', pinyin: 'Zài shízì lùkǒu yòu guǎi.' },
    { id: 'di3', vi: 'Đi bộ năm phút.', en: 'Walk for five minutes.', zh: '走五分钟。', pinyin: 'Zǒu wǔ fēnzhōng.' },
    { id: 'di4', vi: 'Bệnh viện ở đối diện.', en: 'The hospital is across the street.', zh: '医院在对面。', pinyin: 'Yīyuàn zài duìmiàn.' },
    { id: 'di5', vi: 'Bên cạnh ngân hàng.', en: 'Next to the bank.', zh: '在银行旁边。', pinyin: 'Zài yínháng pángbiān.' },
    { id: 'di6', vi: 'Cách đây hai cây số.', en: 'Two kilometers from here.', zh: '离这儿两公里。', pinyin: 'Lí zhèr liǎng gōnglǐ.' },
    { id: 'di7', vi: 'Bạn có bản đồ không?', en: 'Do you have a map?', zh: '你有地图吗？', pinyin: 'Nǐ yǒu dìtú ma?' },
    { id: 'di8', vi: 'Tôi không phải người ở đây.', en: 'I am not from here.', zh: '我不是本地人。', pinyin: 'Wǒ bú shì běndì rén.' },
  ]},

  // ── 14. Sức khỏe ──
  { id: 'health', title: 'Sức khỏe', emoji: '🏥', phrases: [
    { id: 'he1', vi: 'Tôi không khỏe.', en: 'I don’t feel well.', zh: '我不舒服。', pinyin: 'Wǒ bù shūfu.' },
    { id: 'he2', vi: 'Tôi bị đau đầu.', en: 'I have a headache.', zh: '我头疼。', pinyin: 'Wǒ tóu téng.' },
    { id: 'he3', vi: 'Tôi bị cảm.', en: 'I have a cold.', zh: '我感冒了。', pinyin: 'Wǒ gǎnmào le.' },
    { id: 'he4', vi: 'Tôi cần đi bệnh viện.', en: 'I need to go to the hospital.', zh: '我需要去医院。', pinyin: 'Wǒ xūyào qù yīyuàn.' },
    { id: 'he5', vi: 'Tôi cần một viên thuốc.', en: 'I need some medicine.', zh: '我需要药。', pinyin: 'Wǒ xūyào yào.' },
    { id: 'he6', vi: 'Gọi xe cứu thương!', en: 'Call an ambulance!', zh: '叫救护车！', pinyin: 'Jiào jiùhùchē!' },
    { id: 'he7', vi: 'Bạn có sao không?', en: 'Are you okay?', zh: '你还好吗？', pinyin: 'Nǐ hái hǎo ma?' },
    { id: 'he8', vi: 'Nhớ giữ gìn sức khỏe.', en: 'Take care of yourself.', zh: '注意身体。', pinyin: 'Zhùyì shēntǐ.' },
  ]},

  // ── 15. Sở thích ──
  { id: 'hobbies', title: 'Sở thích', emoji: '🎨', phrases: [
    { id: 'ho1', vi: 'Sở thích của bạn là gì?', en: 'What are your hobbies?', zh: '你的爱好是什么？', pinyin: 'Nǐ de àihào shì shénme?' },
    { id: 'ho2', vi: 'Tôi thích chơi bóng đá.', en: 'I like playing football.', zh: '我喜欢踢足球。', pinyin: 'Wǒ xǐhuan tī zúqiú.' },
    { id: 'ho3', vi: 'Tôi thích nghe nhạc.', en: 'I like listening to music.', zh: '我喜欢听音乐。', pinyin: 'Wǒ xǐhuan tīng yīnyuè.' },
    { id: 'ho4', vi: 'Tôi thường xem phim cuối tuần.', en: 'I usually watch movies on weekends.', zh: '我周末常看电影。', pinyin: 'Wǒ zhōumò cháng kàn diànyǐng.' },
    { id: 'ho5', vi: 'Tôi học bơi.', en: 'I learn how to swim.', zh: '我学游泳。', pinyin: 'Wǒ xué yóuyǒng.' },
    { id: 'ho6', vi: 'Tôi vẽ tranh mỗi ngày.', en: 'I draw every day.', zh: '我每天画画。', pinyin: 'Wǒ měitiān huàhuà.' },
    { id: 'ho7', vi: 'Tôi đọc một cuốn sách hay.', en: 'I am reading a good book.', zh: '我在看一本好书。', pinyin: 'Wǒ zài kàn yì běn hǎo shū.' },
    { id: 'ho8', vi: 'Bạn có thích du lịch không?', en: 'Do you like traveling?', zh: '你喜欢旅行吗？', pinyin: 'Nǐ xǐhuan lǚxíng ma?' },
  ]},

  // ── 16. Internet & điện thoại ──
  { id: 'online', title: 'Internet & điện thoại', emoji: '📱', phrases: [
    { id: 'on1', vi: 'Wifi mật khẩu là gì?', en: 'What is the Wi-Fi password?', zh: '无线网密码是什么？', pinyin: 'Wúxiànwǎng mìmǎ shì shénme?' },
    { id: 'on2', vi: 'Tôi không có sóng.', en: 'I have no signal.', zh: '我没有信号。', pinyin: 'Wǒ méiyǒu xìnhào.' },
    { id: 'on3', vi: 'Điện thoại tôi hết pin.', en: 'My phone is out of battery.', zh: '我的手机没电了。', pinyin: 'Wǒ de shǒujī méi diàn le.' },
    { id: 'on4', vi: 'Bạn có thể gửi cho tôi không?', en: 'Could you send it to me?', zh: '你可以发给我吗？', pinyin: 'Nǐ kěyǐ fā gěi wǒ ma?' },
    { id: 'on5', vi: 'Tôi sẽ nhắn cho bạn sau.', en: 'I will text you later.', zh: '我等会儿给你发消息。', pinyin: 'Wǒ děng huìr gěi nǐ fā xiāoxi.' },
    { id: 'on6', vi: 'Để tôi tra mạng.', en: 'Let me look it up online.', zh: '让我上网查一下。', pinyin: 'Ràng wǒ shàngwǎng chá yíxià.' },
    { id: 'on7', vi: 'Hãy gọi video nhé.', en: 'Let’s video call.', zh: '咱们视频通话吧。', pinyin: 'Zánmen shìpín tōnghuà ba.' },
  ]},

  // ── 17. Câu hỏi thông dụng ──
  { id: 'questions', title: 'Câu hỏi thông dụng', emoji: '❓', phrases: [
    { id: 'qu1', vi: 'Cái này là gì?', en: 'What is this?', zh: '这是什么？', pinyin: 'Zhè shì shénme?' },
    { id: 'qu2', vi: 'Ai vậy?', en: 'Who is that?', zh: '那是谁？', pinyin: 'Nà shì shéi?' },
    { id: 'qu3', vi: 'Tại sao?', en: 'Why?', zh: '为什么？', pinyin: 'Wèishéme?' },
    { id: 'qu4', vi: 'Làm sao đến đó?', en: 'How do I get there?', zh: '怎么去那里？', pinyin: 'Zěnme qù nàlǐ?' },
    { id: 'qu5', vi: 'Cái nào tốt hơn?', en: 'Which one is better?', zh: '哪个更好？', pinyin: 'Nǎge gèng hǎo?' },
    { id: 'qu6', vi: 'Bạn có chắc không?', en: 'Are you sure?', zh: '你确定吗？', pinyin: 'Nǐ quèdìng ma?' },
    { id: 'qu7', vi: 'Bao giờ chúng ta đi?', en: 'When are we going?', zh: '我们什么时候去？', pinyin: 'Wǒmen shénme shíhou qù?' },
    { id: 'qu8', vi: 'Bạn cần gì?', en: 'What do you need?', zh: '你需要什么？', pinyin: 'Nǐ xūyào shénme?' },
  ]},

  // ── 18. Tương lai (will / going to) ──
  { id: 'future', title: 'Kế hoạch tương lai', emoji: '🌱', phrases: [
    { id: 'fu1', vi: 'Cuối tuần này tôi sẽ đi công viên.', en: 'I will go to the park this weekend.', zh: '这个周末我会去公园。', pinyin: 'Zhège zhōumò wǒ huì qù gōngyuán.' },
    { id: 'fu2', vi: 'Sang năm tôi sẽ học thêm tiếng Anh.', en: 'Next year I will study more English.', zh: '明年我会多学英语。', pinyin: 'Míngnián wǒ huì duō xué Yīngyǔ.' },
    { id: 'fu3', vi: 'Tôi định mua một quyển sách mới.', en: 'I am going to buy a new book.', zh: '我打算买一本新书。', pinyin: 'Wǒ dǎsuàn mǎi yì běn xīn shū.' },
    { id: 'fu4', vi: 'Chúng tôi sẽ gặp lúc bảy giờ.', en: 'We will meet at seven.', zh: '我们七点见面。', pinyin: 'Wǒmen qī diǎn jiànmiàn.' },
    { id: 'fu5', vi: 'Ngày mai trời sẽ mưa.', en: 'It will rain tomorrow.', zh: '明天会下雨。', pinyin: 'Míngtiān huì xià yǔ.' },
    { id: 'fu6', vi: 'Tôi sẽ cố gắng hết sức.', en: 'I will try my best.', zh: '我会尽力。', pinyin: 'Wǒ huì jìnlì.' },
    { id: 'fu7', vi: 'Tôi sẽ không quên.', en: 'I won’t forget.', zh: '我不会忘。', pinyin: 'Wǒ bú huì wàng.' },
  ]},

  // ── 19. Quá khứ ──
  { id: 'past', title: 'Quá khứ', emoji: '⏪', phrases: [
    { id: 'pa1', vi: 'Hôm qua tôi đã đến thư viện.', en: 'Yesterday I went to the library.', zh: '昨天我去了图书馆。', pinyin: 'Zuótiān wǒ qù le túshūguǎn.' },
    { id: 'pa2', vi: 'Sáng nay tôi đã ăn phở.', en: 'This morning I ate pho.', zh: '今早我吃了河粉。', pinyin: 'Jīn zǎo wǒ chī le héfěn.' },
    { id: 'pa3', vi: 'Tuần trước trời mưa nhiều.', en: 'It rained a lot last week.', zh: '上周下了很多雨。', pinyin: 'Shàng zhōu xià le hěn duō yǔ.' },
    { id: 'pa4', vi: 'Tôi đã đọc xong cuốn sách.', en: 'I finished the book.', zh: '我看完了那本书。', pinyin: 'Wǒ kàn wán le nà běn shū.' },
    { id: 'pa5', vi: 'Tôi đã từng đến Bắc Kinh.', en: 'I have been to Beijing.', zh: '我去过北京。', pinyin: 'Wǒ qù guo Běijīng.' },
    { id: 'pa6', vi: 'Bạn đã ăn cơm chưa?', en: 'Have you eaten?', zh: '你吃饭了吗？', pinyin: 'Nǐ chīfàn le ma?' },
    { id: 'pa7', vi: 'Tôi đã làm xong bài tập.', en: 'I have finished the homework.', zh: '我做完作业了。', pinyin: 'Wǒ zuò wán zuòyè le.' },
  ]},

  // ── 20. So sánh ──
  { id: 'compare', title: 'So sánh', emoji: '⚖️', phrases: [
    { id: 'co1', vi: 'Anh ấy cao hơn tôi.', en: 'He is taller than me.', zh: '他比我高。', pinyin: 'Tā bǐ wǒ gāo.' },
    { id: 'co2', vi: 'Cái này rẻ hơn cái kia.', en: 'This is cheaper than that.', zh: '这个比那个便宜。', pinyin: 'Zhège bǐ nàge piányi.' },
    { id: 'co3', vi: 'Tiếng Trung khó hơn tiếng Anh.', en: 'Chinese is harder than English.', zh: '汉语比英语难。', pinyin: 'Hànyǔ bǐ Yīngyǔ nán.' },
    { id: 'co4', vi: 'Hôm nay nóng nhất trong năm.', en: 'Today is the hottest day of the year.', zh: '今天是一年中最热的一天。', pinyin: 'Jīntiān shì yì nián zhōng zuì rè de yì tiān.' },
    { id: 'co5', vi: 'Tôi cũng nghĩ vậy.', en: 'I think so too.', zh: '我也这样想。', pinyin: 'Wǒ yě zhèyàng xiǎng.' },
    { id: 'co6', vi: 'Cả hai đều tốt.', en: 'Both are good.', zh: '两个都好。', pinyin: 'Liǎng ge dōu hǎo.' },
  ]},

  // ── 21. Ý kiến ──
  { id: 'opinion', title: 'Ý kiến', emoji: '💭', phrases: [
    { id: 'op1', vi: 'Tôi nghĩ bạn đúng.', en: 'I think you are right.', zh: '我觉得你说得对。', pinyin: 'Wǒ juéde nǐ shuō de duì.' },
    { id: 'op2', vi: 'Tôi không đồng ý.', en: 'I don’t agree.', zh: '我不同意。', pinyin: 'Wǒ bù tóngyì.' },
    { id: 'op3', vi: 'Tùy bạn thôi.', en: 'It’s up to you.', zh: '随你便。', pinyin: 'Suí nǐ biàn.' },
    { id: 'op4', vi: 'Theo tôi, cách này tốt hơn.', en: 'In my opinion, this way is better.', zh: '我觉得这样更好。', pinyin: 'Wǒ juéde zhèyàng gèng hǎo.' },
    { id: 'op5', vi: 'Bạn nghĩ sao?', en: 'What do you think?', zh: '你觉得呢？', pinyin: 'Nǐ juéde ne?' },
    { id: 'op6', vi: 'Tôi không chắc.', en: 'I am not sure.', zh: '我不太确定。', pinyin: 'Wǒ bú tài quèdìng.' },
  ]},

  // ── 22. Câu điều kiện ──
  { id: 'conditional', title: 'Câu điều kiện', emoji: '🔀', phrases: [
    { id: 'cd1', vi: 'Nếu trời mưa, tôi sẽ ở nhà.', en: 'If it rains, I will stay home.', zh: '如果下雨，我就待在家里。', pinyin: 'Rúguǒ xià yǔ, wǒ jiù dāi zài jiā lǐ.' },
    { id: 'cd2', vi: 'Nếu bạn rảnh, hãy gọi tôi.', en: 'If you are free, call me.', zh: '如果你有空，就给我打电话。', pinyin: 'Rúguǒ nǐ yǒu kòng, jiù gěi wǒ dǎ diànhuà.' },
    { id: 'cd3', vi: 'Nếu tôi có tiền, tôi sẽ đi du lịch.', en: 'If I had money, I would travel.', zh: '如果我有钱，我就去旅行。', pinyin: 'Rúguǒ wǒ yǒu qián, wǒ jiù qù lǚxíng.' },
    { id: 'cd4', vi: 'Nếu chăm học, bạn sẽ thi đậu.', en: 'If you study hard, you will pass the exam.', zh: '如果努力学习，你就会通过考试。', pinyin: 'Rúguǒ nǔlì xuéxí, nǐ jiù huì tōngguò kǎoshì.' },
    { id: 'cd5', vi: 'Khi nào rảnh, tôi sẽ đọc sách.', en: 'When I am free, I read books.', zh: '有空的时候，我会看书。', pinyin: 'Yǒu kòng de shíhou, wǒ huì kàn shū.' },
    { id: 'cd6', vi: 'Trừ khi bạn đi, tôi cũng không đi.', en: 'Unless you go, I won’t go either.', zh: '除非你去，否则我也不去。', pinyin: 'Chúfēi nǐ qù, fǒuzé wǒ yě bú qù.' },
    { id: 'cd7', vi: 'Nếu tôi là bạn, tôi sẽ xin lỗi.', en: 'If I were you, I would apologize.', zh: '如果我是你，我会道歉。', pinyin: 'Rúguǒ wǒ shì nǐ, wǒ huì dàoqiàn.' },
    { id: 'cd8', vi: 'Giá như tôi biết sớm hơn.', en: 'I wish I had known earlier.', zh: '我希望我能早点知道。', pinyin: 'Wǒ xīwàng wǒ néng zǎodiǎn zhīdao.' },
  ]},

  // ── 23. Tại nhà ──
  { id: 'home', title: 'Tại nhà', emoji: '🏠', phrases: [
    { id: 'hm1', vi: 'Tôi đang ở nhà.', en: 'I am at home.', zh: '我在家。', pinyin: 'Wǒ zài jiā.' },
    { id: 'hm2', vi: 'Hãy mở cửa giúp tôi.', en: 'Please open the door for me.', zh: '请帮我开门。', pinyin: 'Qǐng bāng wǒ kāi mén.' },
    { id: 'hm3', vi: 'Tắt đèn đi nhé.', en: 'Please turn off the light.', zh: '请关灯。', pinyin: 'Qǐng guān dēng.' },
    { id: 'hm4', vi: 'Cơm tối đã sẵn sàng.', en: 'Dinner is ready.', zh: '晚饭好了。', pinyin: 'Wǎnfàn hǎo le.' },
    { id: 'hm5', vi: 'Tôi cần đi tắm.', en: 'I need to take a shower.', zh: '我需要洗澡。', pinyin: 'Wǒ xūyào xǐzǎo.' },
    { id: 'hm6', vi: 'Hôm nay đến lượt tôi rửa bát.', en: 'It’s my turn to wash the dishes today.', zh: '今天该我洗碗了。', pinyin: 'Jīntiān gāi wǒ xǐ wǎn le.' },
    { id: 'hm7', vi: 'Tôi đi ngủ đây.', en: 'I’m going to bed.', zh: '我去睡觉了。', pinyin: 'Wǒ qù shuìjiào le.' },
  ]},

  // ── 24. Tại nhà hàng ──
  { id: 'restaurant', title: 'Ở nhà hàng', emoji: '🍽️', phrases: [
    { id: 'rs1', vi: 'Cho tôi xem thực đơn.', en: 'May I see the menu?', zh: '请给我看一下菜单。', pinyin: 'Qǐng gěi wǒ kàn yíxià càidān.' },
    { id: 'rs2', vi: 'Bạn gợi ý món gì?', en: 'What do you recommend?', zh: '你推荐什么菜？', pinyin: 'Nǐ tuījiàn shénme cài?' },
    { id: 'rs3', vi: 'Cho hai phần.', en: 'Two servings, please.', zh: '请来两份。', pinyin: 'Qǐng lái liǎng fèn.' },
    { id: 'rs4', vi: 'Tôi không ăn được cay.', en: 'I can’t eat spicy food.', zh: '我不能吃辣。', pinyin: 'Wǒ bù néng chī là.' },
    { id: 'rs5', vi: 'Cho thêm một ly nước.', en: 'One more glass of water, please.', zh: '请再来一杯水。', pinyin: 'Qǐng zài lái yì bēi shuǐ.' },
    { id: 'rs6', vi: 'Đồ ăn rất ngon.', en: 'The food is very tasty.', zh: '菜很好吃。', pinyin: 'Cài hěn hǎochī.' },
    { id: 'rs7', vi: 'Cho hoá đơn, làm ơn.', en: 'Bill, please.', zh: '请结账。', pinyin: 'Qǐng jiézhàng.' },
  ]},

  // ── 25. Gặp gỡ & xã giao ──
  { id: 'social', title: 'Gặp gỡ & xã giao', emoji: '🤝', phrases: [
    { id: 'so1', vi: 'Bạn rảnh không?', en: 'Are you free?', zh: '你有空吗？', pinyin: 'Nǐ yǒu kòng ma?' },
    { id: 'so2', vi: 'Cùng đi uống cà phê nhé.', en: 'Let’s go for a coffee.', zh: '咱们一起去喝咖啡吧。', pinyin: 'Zánmen yìqǐ qù hē kāfēi ba.' },
    { id: 'so3', vi: 'Chúc mừng sinh nhật!', en: 'Happy birthday!', zh: '生日快乐！', pinyin: 'Shēngrì kuàilè!' },
    { id: 'so4', vi: 'Chúc mừng năm mới!', en: 'Happy new year!', zh: '新年快乐！', pinyin: 'Xīnnián kuàilè!' },
    { id: 'so5', vi: 'Chúc một ngày tốt lành.', en: 'Have a nice day.', zh: '祝你今天愉快。', pinyin: 'Zhù nǐ jīntiān yúkuài.' },
    { id: 'so6', vi: 'Cảm ơn vì đã đến.', en: 'Thanks for coming.', zh: '谢谢你来。', pinyin: 'Xièxie nǐ lái.' },
    { id: 'so7', vi: 'Tôi rất tiếc.', en: 'I am very sorry.', zh: '我很抱歉。', pinyin: 'Wǒ hěn bàoqiàn.' },
  ]},

  // ── 26. Màu sắc ──
  { id: 'colors', title: 'Màu sắc', emoji: '🎨', phrases: [
    { id: 'cl1', vi: 'Đây là màu đỏ.', en: 'This is red.', zh: '这是红色。', pinyin: 'Zhè shì hóngsè.' },
    { id: 'cl2', vi: 'Bầu trời màu xanh.', en: 'The sky is blue.', zh: '天空是蓝色的。', pinyin: 'Tiānkōng shì lánsè de.' },
    { id: 'cl3', vi: 'Cây màu xanh lá.', en: 'The tree is green.', zh: '树是绿色的。', pinyin: 'Shù shì lǜsè de.' },
    { id: 'cl4', vi: 'Mặt trời màu vàng.', en: 'The sun is yellow.', zh: '太阳是黄色的。', pinyin: 'Tàiyáng shì huángsè de.' },
    { id: 'cl5', vi: 'Tôi thích màu hồng.', en: 'I like pink.', zh: '我喜欢粉色。', pinyin: 'Wǒ xǐhuan fěnsè.' },
    { id: 'cl6', vi: 'Áo bạn màu trắng.', en: 'Your shirt is white.', zh: '你的衣服是白色的。', pinyin: 'Nǐ de yīfu shì báisè de.' },
    { id: 'cl7', vi: 'Mèo màu đen.', en: 'The cat is black.', zh: '猫是黑色的。', pinyin: 'Māo shì hēisè de.' },
    { id: 'cl8', vi: 'Bạn thích màu gì nhất?', en: 'What is your favorite color?', zh: '你最喜欢什么颜色？', pinyin: 'Nǐ zuì xǐhuan shénme yánsè?' },
    { id: 'cl9', vi: 'Có màu nâu không?', en: 'Do you have brown?', zh: '有棕色的吗？', pinyin: 'Yǒu zōngsè de ma?' },
    { id: 'cl10', vi: 'Tôi muốn cái màu cam.', en: 'I want the orange one.', zh: '我要橙色的。', pinyin: 'Wǒ yào chéngsè de.' },
  ]},

  // ── 27. Cơ thể ──
  { id: 'body', title: 'Cơ thể', emoji: '🧍', phrases: [
    { id: 'bd1', vi: 'Đầu của tôi đau.', en: 'My head hurts.', zh: '我的头疼。', pinyin: 'Wǒ de tóu téng.' },
    { id: 'bd2', vi: 'Mắt tôi mỏi.', en: 'My eyes are tired.', zh: '我的眼睛累了。', pinyin: 'Wǒ de yǎnjing lèi le.' },
    { id: 'bd3', vi: 'Tay tôi lạnh.', en: 'My hands are cold.', zh: '我的手很冷。', pinyin: 'Wǒ de shǒu hěn lěng.' },
    { id: 'bd4', vi: 'Chân tôi đau.', en: 'My legs hurt.', zh: '我的腿疼。', pinyin: 'Wǒ de tuǐ téng.' },
    { id: 'bd5', vi: 'Răng tôi đau.', en: 'My tooth hurts.', zh: '我的牙疼。', pinyin: 'Wǒ de yá téng.' },
    { id: 'bd6', vi: 'Hãy rửa tay.', en: 'Please wash your hands.', zh: '请洗手。', pinyin: 'Qǐng xǐ shǒu.' },
    { id: 'bd7', vi: 'Đứng lên giúp tôi.', en: 'Please stand up.', zh: '请站起来。', pinyin: 'Qǐng zhàn qǐlái.' },
    { id: 'bd8', vi: 'Hãy ngồi xuống.', en: 'Please sit down.', zh: '请坐。', pinyin: 'Qǐng zuò.' },
    { id: 'bd9', vi: 'Hít thở sâu.', en: 'Take a deep breath.', zh: '深呼吸。', pinyin: 'Shēn hūxī.' },
    { id: 'bd10', vi: 'Tôi cao 1m70.', en: 'I am 170 cm tall.', zh: '我身高一米七。', pinyin: 'Wǒ shēngāo yì mǐ qī.' },
  ]},

  // ── 28. Động vật ──
  { id: 'animals', title: 'Động vật', emoji: '🐶', phrases: [
    { id: 'an1', vi: 'Tôi có một con mèo.', en: 'I have a cat.', zh: '我有一只猫。', pinyin: 'Wǒ yǒu yì zhī māo.' },
    { id: 'an2', vi: 'Chó của tôi rất ngoan.', en: 'My dog is very good.', zh: '我的狗很乖。', pinyin: 'Wǒ de gǒu hěn guāi.' },
    { id: 'an3', vi: 'Tôi sợ rắn.', en: 'I am afraid of snakes.', zh: '我怕蛇。', pinyin: 'Wǒ pà shé.' },
    { id: 'an4', vi: 'Con chim đang hót.', en: 'The bird is singing.', zh: '鸟在唱歌。', pinyin: 'Niǎo zài chànggē.' },
    { id: 'an5', vi: 'Con cá đang bơi.', en: 'The fish is swimming.', zh: '鱼在游。', pinyin: 'Yú zài yóu.' },
    { id: 'an6', vi: 'Voi rất to.', en: 'The elephant is very big.', zh: '大象很大。', pinyin: 'Dàxiàng hěn dà.' },
    { id: 'an7', vi: 'Tôi đã đến sở thú.', en: 'I went to the zoo.', zh: '我去了动物园。', pinyin: 'Wǒ qù le dòngwùyuán.' },
    { id: 'an8', vi: 'Con thỏ ăn cà rốt.', en: 'The rabbit eats carrots.', zh: '兔子吃萝卜。', pinyin: 'Tùzi chī luóbo.' },
    { id: 'an9', vi: 'Bạn có nuôi thú cưng không?', en: 'Do you have a pet?', zh: '你养宠物吗？', pinyin: 'Nǐ yǎng chǒngwù ma?' },
    { id: 'an10', vi: 'Con khỉ leo cây giỏi.', en: 'The monkey climbs trees well.', zh: '猴子很会爬树。', pinyin: 'Hóuzi hěn huì pá shù.' },
  ]},

  // ── 29. Quần áo ──
  { id: 'clothes', title: 'Quần áo', emoji: '👕', phrases: [
    { id: 'cl1c', vi: 'Tôi cần áo mới.', en: 'I need a new shirt.', zh: '我需要一件新衣服。', pinyin: 'Wǒ xūyào yí jiàn xīn yīfu.' },
    { id: 'cl2c', vi: 'Áo này hợp với tôi không?', en: 'Does this shirt suit me?', zh: '这件衣服适合我吗？', pinyin: 'Zhè jiàn yīfu shìhé wǒ ma?' },
    { id: 'cl3c', vi: 'Tôi có thể thử không?', en: 'May I try it on?', zh: '我可以试试吗？', pinyin: 'Wǒ kěyǐ shìshi ma?' },
    { id: 'cl4c', vi: 'Phòng thử ở đâu?', en: 'Where is the fitting room?', zh: '试衣间在哪里？', pinyin: 'Shìyījiān zài nǎlǐ?' },
    { id: 'cl5c', vi: 'Cái này hơi chật.', en: 'This is a bit tight.', zh: '这个有点紧。', pinyin: 'Zhège yǒudiǎn jǐn.' },
    { id: 'cl6c', vi: 'Có cỡ nhỏ hơn không?', en: 'Do you have a smaller size?', zh: '有小一点的吗？', pinyin: 'Yǒu xiǎo yìdiǎn de ma?' },
    { id: 'cl7c', vi: 'Tôi đi giày cỡ 40.', en: 'I wear size 40 shoes.', zh: '我穿四十码的鞋。', pinyin: 'Wǒ chuān sìshí mǎ de xié.' },
    { id: 'cl8c', vi: 'Tôi sẽ lấy cái này.', en: 'I will take this.', zh: '我要这个。', pinyin: 'Wǒ yào zhège.' },
    { id: 'cl9c', vi: 'Hôm nay tôi mặc áo khoác.', en: 'Today I am wearing a jacket.', zh: '今天我穿了外套。', pinyin: 'Jīntiān wǒ chuān le wàitào.' },
    { id: 'cl10c', vi: 'Đừng quên đội mũ.', en: 'Don’t forget to wear a hat.', zh: '别忘了戴帽子。', pinyin: 'Bié wàng le dài màozi.' },
  ]},

  // ── 30. Sân bay & khách sạn ──
  { id: 'airport', title: 'Sân bay & khách sạn', emoji: '🛬', phrases: [
    { id: 'ap1', vi: 'Cho tôi xem hộ chiếu.', en: 'May I see your passport?', zh: '请出示护照。', pinyin: 'Qǐng chūshì hùzhào.' },
    { id: 'ap2', vi: 'Tôi đến để du lịch.', en: 'I am here for tourism.', zh: '我来旅游。', pinyin: 'Wǒ lái lǚyóu.' },
    { id: 'ap3', vi: 'Tôi ở lại bảy ngày.', en: 'I am staying for seven days.', zh: '我住七天。', pinyin: 'Wǒ zhù qī tiān.' },
    { id: 'ap4', vi: 'Cửa nào lên máy bay?', en: 'Which gate for boarding?', zh: '哪个登机口？', pinyin: 'Nǎge dēngjīkǒu?' },
    { id: 'ap5', vi: 'Tôi muốn đặt phòng.', en: 'I would like to book a room.', zh: '我想订一个房间。', pinyin: 'Wǒ xiǎng dìng yí ge fángjiān.' },
    { id: 'ap6', vi: 'Có Wi-Fi miễn phí không?', en: 'Is there free Wi-Fi?', zh: '有免费无线网吗？', pinyin: 'Yǒu miǎnfèi wúxiànwǎng ma?' },
    { id: 'ap7', vi: 'Bữa sáng lúc mấy giờ?', en: 'What time is breakfast?', zh: '早餐几点？', pinyin: 'Zǎocān jǐ diǎn?' },
    { id: 'ap8', vi: 'Cho tôi chìa khoá phòng.', en: 'May I have the room key?', zh: '请给我房间钥匙。', pinyin: 'Qǐng gěi wǒ fángjiān yàoshi.' },
    { id: 'ap9', vi: 'Tôi đã đặt online.', en: 'I booked online.', zh: '我在网上订了。', pinyin: 'Wǒ zài wǎngshàng dìng le.' },
    { id: 'ap10', vi: 'Mấy giờ phải trả phòng?', en: 'What time is check-out?', zh: '几点退房？', pinyin: 'Jǐ diǎn tuìfáng?' },
  ]},

  // ── 31. Đồng ý / từ chối ──
  { id: 'agree', title: 'Đồng ý & từ chối', emoji: '👍', phrases: [
    { id: 'ag1', vi: 'Đồng ý.', en: 'I agree.', zh: '我同意。', pinyin: 'Wǒ tóngyì.' },
    { id: 'ag2', vi: 'Không vấn đề gì.', en: 'No problem.', zh: '没问题。', pinyin: 'Méi wèntí.' },
    { id: 'ag3', vi: 'Được thôi.', en: 'Sure, okay.', zh: '好的。', pinyin: 'Hǎo de.' },
    { id: 'ag4', vi: 'Để tôi suy nghĩ đã.', en: 'Let me think about it.', zh: '让我想想。', pinyin: 'Ràng wǒ xiǎngxiang.' },
    { id: 'ag5', vi: 'Xin lỗi, tôi không thể.', en: 'Sorry, I can’t.', zh: '抱歉，我不能。', pinyin: 'Bàoqiàn, wǒ bù néng.' },
    { id: 'ag6', vi: 'Có thể lần sau.', en: 'Maybe next time.', zh: '下次吧。', pinyin: 'Xiàcì ba.' },
    { id: 'ag7', vi: 'Tôi không thích.', en: 'I don’t like it.', zh: '我不喜欢。', pinyin: 'Wǒ bù xǐhuan.' },
    { id: 'ag8', vi: 'Tốt rồi, cảm ơn.', en: 'That’s fine, thanks.', zh: '可以，谢谢。', pinyin: 'Kěyǐ, xièxie.' },
  ]},

  // ── 32. Khen ngợi ──
  { id: 'compliment', title: 'Khen ngợi', emoji: '🌟', phrases: [
    { id: 'cp1', vi: 'Bạn làm tốt lắm!', en: 'You did great!', zh: '你做得很好！', pinyin: 'Nǐ zuò de hěn hǎo!' },
    { id: 'cp2', vi: 'Bạn rất giỏi.', en: 'You are very good.', zh: '你很棒。', pinyin: 'Nǐ hěn bàng.' },
    { id: 'cp3', vi: 'Bạn thông minh quá.', en: 'You are so smart.', zh: '你真聪明。', pinyin: 'Nǐ zhēn cōngming.' },
    { id: 'cp4', vi: 'Cảm ơn lời khen.', en: 'Thanks for the compliment.', zh: '谢谢你的夸奖。', pinyin: 'Xièxie nǐ de kuājiǎng.' },
    { id: 'cp5', vi: 'Cứ tiếp tục cố gắng nhé.', en: 'Keep up the good work.', zh: '继续努力。', pinyin: 'Jìxù nǔlì.' },
    { id: 'cp6', vi: 'Tôi ngưỡng mộ bạn.', en: 'I admire you.', zh: '我佩服你。', pinyin: 'Wǒ pèifú nǐ.' },
    { id: 'cp7', vi: 'Bạn nói tiếng Trung hay quá.', en: 'Your Chinese is great.', zh: '你的中文很好。', pinyin: 'Nǐ de Zhōngwén hěn hǎo.' },
    { id: 'cp8', vi: 'Hôm nay bạn trông tuyệt lắm.', en: 'You look great today.', zh: '你今天看起来真棒。', pinyin: 'Nǐ jīntiān kàn qǐlái zhēn bàng.' },
  ]},

  // ── 33. Tiền & ngân hàng ──
  { id: 'money', title: 'Tiền & ngân hàng', emoji: '💴', phrases: [
    { id: 'mo1', vi: 'Tôi muốn đổi tiền.', en: 'I want to exchange money.', zh: '我想换钱。', pinyin: 'Wǒ xiǎng huànqián.' },
    { id: 'mo2', vi: 'Tỷ giá hôm nay là bao nhiêu?', en: 'What is today’s exchange rate?', zh: '今天的汇率是多少？', pinyin: 'Jīntiān de huìlǜ shì duōshǎo?' },
    { id: 'mo3', vi: 'Tôi cần rút tiền.', en: 'I need to withdraw money.', zh: '我需要取钱。', pinyin: 'Wǒ xūyào qǔ qián.' },
    { id: 'mo4', vi: 'Cây ATM ở đâu?', en: 'Where is an ATM?', zh: 'ATM在哪里？', pinyin: 'ATM zài nǎlǐ?' },
    { id: 'mo5', vi: 'Tôi quên ví ở nhà.', en: 'I forgot my wallet at home.', zh: '我把钱包忘在家了。', pinyin: 'Wǒ bǎ qiánbāo wàng zài jiā le.' },
    { id: 'mo6', vi: 'Có chấp nhận thẻ không?', en: 'Do you accept cards?', zh: '你们收信用卡吗？', pinyin: 'Nǐmen shōu xìnyòngkǎ ma?' },
    { id: 'mo7', vi: 'Cho tôi hoá đơn.', en: 'Please give me a receipt.', zh: '请给我发票。', pinyin: 'Qǐng gěi wǒ fāpiào.' },
    { id: 'mo8', vi: 'Tôi muốn chuyển khoản.', en: 'I want to make a transfer.', zh: '我想转账。', pinyin: 'Wǒ xiǎng zhuǎnzhàng.' },
  ]},

  // ── 34. Lễ tết ──
  { id: 'holiday', title: 'Lễ tết', emoji: '🎉', phrases: [
    { id: 'ho1h', vi: 'Chúc bạn lễ vui vẻ!', en: 'Happy holidays!', zh: '节日快乐！', pinyin: 'Jiérì kuàilè!' },
    { id: 'ho2h', vi: 'Chúc mừng Trung Thu.', en: 'Happy Mid-Autumn Festival.', zh: '中秋节快乐。', pinyin: 'Zhōngqiūjié kuàilè.' },
    { id: 'ho3h', vi: 'Tết này gia đình tôi về quê.', en: 'This Tet my family goes back home.', zh: '这个春节我们家回老家。', pinyin: 'Zhège chūnjié wǒmen jiā huí lǎojiā.' },
    { id: 'ho4h', vi: 'Bạn có kế hoạch nghỉ lễ chưa?', en: 'Do you have any holiday plans?', zh: '你有假期计划吗？', pinyin: 'Nǐ yǒu jiàqī jìhuà ma?' },
    { id: 'ho5h', vi: 'Tôi sẽ về nhà ăn Tết.', en: 'I will go home for the new year.', zh: '我要回家过年。', pinyin: 'Wǒ yào huí jiā guònián.' },
    { id: 'ho6h', vi: 'Có pháo hoa tối nay.', en: 'There are fireworks tonight.', zh: '今晚有烟花。', pinyin: 'Jīn wǎn yǒu yānhuā.' },
    { id: 'ho7h', vi: 'Mừng tuổi cho em.', en: 'Here is some lucky money for you.', zh: '给你压岁钱。', pinyin: 'Gěi nǐ yāsuìqián.' },
    { id: 'ho8h', vi: 'Chúc bạn nhiều sức khoẻ.', en: 'I wish you good health.', zh: '祝你身体健康。', pinyin: 'Zhù nǐ shēntǐ jiànkāng.' },
  ]},

  // ── 35. Vị trí / Phương hướng ──
  { id: 'position', title: 'Vị trí & phương hướng', emoji: '📍', phrases: [
    { id: 'ps1', vi: 'Cái này ở trên bàn.', en: 'It is on the table.', zh: '它在桌子上。', pinyin: 'Tā zài zhuōzi shàng.' },
    { id: 'ps2', vi: 'Mèo ở dưới ghế.', en: 'The cat is under the chair.', zh: '猫在椅子下面。', pinyin: 'Māo zài yǐzi xiàmiàn.' },
    { id: 'ps3', vi: 'Sách ở trong cặp.', en: 'The book is in the bag.', zh: '书在书包里。', pinyin: 'Shū zài shūbāo lǐ.' },
    { id: 'ps4', vi: 'Cửa hàng ở bên trái.', en: 'The shop is on the left.', zh: '商店在左边。', pinyin: 'Shāngdiàn zài zuǒbiān.' },
    { id: 'ps5', vi: 'Trường học ở bên phải.', en: 'The school is on the right.', zh: '学校在右边。', pinyin: 'Xuéxiào zài yòubiān.' },
    { id: 'ps6', vi: 'Phía trước có công viên.', en: 'There is a park ahead.', zh: '前面有一个公园。', pinyin: 'Qiánmiàn yǒu yí ge gōngyuán.' },
    { id: 'ps7', vi: 'Đằng sau là nhà tôi.', en: 'My house is behind.', zh: '我家在后面。', pinyin: 'Wǒ jiā zài hòumiàn.' },
    { id: 'ps8', vi: 'Cạnh nhau.', en: 'Next to each other.', zh: '在一起。', pinyin: 'Zài yìqǐ.' },
    { id: 'ps9', vi: 'Đi lên tầng hai.', en: 'Go up to the second floor.', zh: '上二楼。', pinyin: 'Shàng èr lóu.' },
    { id: 'ps10', vi: 'Đi xuống tầng hầm.', en: 'Go down to the basement.', zh: '下到地下室。', pinyin: 'Xià dào dìxiàshì.' },
  ]},
];

/** Worker audio key for a phrase in a given language (zh/ prefix → Qwen TTS). */
export function phraseAudioKey(lang: 'en' | 'zh', id: string): string {
  return lang === 'zh' ? `zh/phrasebook/${id}.mp3` : `phrasebook/${id}.mp3`;
}
