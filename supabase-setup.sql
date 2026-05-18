-- =============================================================
-- 📋 RUN THIS SQL IN SUPABASE DASHBOARD
-- =============================================================
-- Go to: https://supabase.com/dashboard → Your Project → SQL Editor
-- Paste this entire script and click "Run"
-- =============================================================

-- Create the news table
CREATE TABLE IF NOT EXISTS news (
  id BIGINT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  image TEXT DEFAULT '',
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  breaking BOOLEAN DEFAULT FALSE
);

-- Allow public read/write (since admin auth is handled in the app)
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON news FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON news FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON news FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON news FOR DELETE USING (true);

-- Enable real-time so all devices get instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE news;

-- Insert seed data
INSERT INTO news (id, title, category, image, content, date, breaking) VALUES
(1000001, 'Akola Municipal Corporation Launches Smart City Phase-II Project', 'Local', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80', 'The Akola Municipal Corporation has officially announced the second phase of its Smart City project, focusing on digital infrastructure, improved water supply systems, and modernized public transport. The project is expected to benefit over 5 lakh residents.

Key highlights include:
• Installation of 500+ smart CCTV cameras
• Wi-Fi enabled public spaces
• Upgraded drainage and sewage systems
• New electric bus routes connecting major areas

The estimated budget for Phase-II is Rs. 850 crores, with completion targeted by 2028.', NOW()::TEXT, true),

(1000002, 'Akola District Cricket Team Wins Vidarbha Trophy', 'Sports', 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&q=80', 'In a thrilling final match, the Akola District Cricket Team has clinched the prestigious Vidarbha Trophy, defeating Nagpur by 45 runs at the VCA Stadium.

Captain Rahul Deshmukh scored a brilliant 127 runs off 134 balls, earning the Player of the Match award. The team''s bowling attack, led by fast bowler Akash Patil who took 4 wickets, proved decisive in the victory.

This is Akola''s third Vidarbha Trophy win in the last decade, marking a significant milestone for cricket in the district.', NOW()::TEXT, false),

(1000003, 'New Education Hub Planned Near Akola Railway Station', 'Education', 'https://images.unsplash.com/photo-1523050854058-8df90110c8f1?w=600&q=80', 'A major education hub featuring coaching centers, a digital library, and skill development workshops is being planned near the Akola Railway Station area.

The project, backed by the state education department, aims to provide accessible learning resources to students from rural and semi-urban backgrounds. The hub will feature:

• A 3-floor digital library with 10,000+ books
• Free coding and AI workshops
• Competitive exam preparation centers
• Career counseling services

Construction is set to begin in Q3 2026.', NOW()::TEXT, false),

(1000004, 'Local Entrepreneurs Launch Organic Farming Collective in Akola', 'Business', 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&q=80', 'A group of young entrepreneurs from Akola has launched an organic farming collective, connecting local farmers directly with consumers through a mobile app.

The initiative, named "Akola Green," currently supports over 200 farmers and delivers fresh organic produce to doorsteps across the city. The collective also conducts free workshops on sustainable farming techniques.

The project has received recognition from the Maharashtra Agricultural Board and is being considered as a model for other districts.', NOW()::TEXT, false);
