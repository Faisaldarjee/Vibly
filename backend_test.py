import requests
import sys
import json
from datetime import datetime

class ViblyAPITester:
    def __init__(self, base_url="https://0a37f5dd-ae48-4216-8dd1-3bf5ce6ca95c.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=True):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                self.failed_tests.append({
                    "test": name,
                    "endpoint": endpoint,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "error": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "endpoint": endpoint,
                "error": str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "api/health", 200, auth_required=False)

    def test_register(self):
        """Test user registration"""
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@vibly.com"
        success, response = self.run_test(
            "User Registration",
            "POST",
            "api/auth/register",
            200,
            data={"name": "Test User", "email": test_email, "password": "Test123!"},
            auth_required=False
        )
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_login(self):
        """Test user login with existing credentials"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": "test@vibly.com", "password": "Test123!"},
            auth_required=False
        )
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        return self.run_test("Get Current User", "GET", "api/auth/me", 200)

    def test_habit_templates(self):
        """Test get habit templates"""
        return self.run_test("Get Habit Templates", "GET", "api/habits/templates", 200, auth_required=False)

    def test_habits_crud(self):
        """Test habits CRUD operations"""
        # Get habits
        success, _ = self.run_test("Get Habits", "GET", "api/habits", 200)
        if not success:
            return False

        # Create habit
        success, habit = self.run_test(
            "Create Habit",
            "POST",
            "api/habits",
            200,
            data={"name": "Test Habit", "icon": "circle", "color": "#007AFF", "frequency": "daily"}
        )
        if not success or 'id' not in habit:
            return False

        habit_id = habit['id']

        # Toggle habit
        success, _ = self.run_test(f"Toggle Habit", "POST", f"api/habits/{habit_id}/toggle", 200)
        if not success:
            return False

        # Delete habit
        success, _ = self.run_test(f"Delete Habit", "DELETE", f"api/habits/{habit_id}", 200)
        return success

    def test_goals_crud(self):
        """Test goals CRUD operations"""
        # Get goals
        success, _ = self.run_test("Get Goals", "GET", "api/goals", 200)
        if not success:
            return False

        # Create goal
        success, goal = self.run_test(
            "Create Goal",
            "POST",
            "api/goals",
            200,
            data={"title": "Test Goal", "description": "Test description", "target_value": 100, "unit": "%"}
        )
        if not success or 'id' not in goal:
            return False

        goal_id = goal['id']

        # Update goal progress
        success, _ = self.run_test(
            f"Update Goal Progress",
            "PUT",
            f"api/goals/{goal_id}/progress",
            200,
            data={"current_value": 50}
        )
        if not success:
            return False

        # Delete goal
        success, _ = self.run_test(f"Delete Goal", "DELETE", f"api/goals/{goal_id}", 200)
        return success

    def test_vitals(self):
        """Test vitals endpoints"""
        # Log vital
        success, _ = self.run_test(
            "Log Vital",
            "POST",
            "api/vitals",
            200,
            data={"vital_type": "water", "value": 8}
        )
        if not success:
            return False

        # Get today's vitals
        success, _ = self.run_test("Get Today Vitals", "GET", "api/vitals/today", 200)
        if not success:
            return False

        # Get week vitals
        success, _ = self.run_test("Get Week Vitals", "GET", "api/vitals/week", 200)
        return success

    def test_analytics(self):
        """Test analytics endpoints"""
        # Get vibe score
        success, _ = self.run_test("Get Vibe Score", "GET", "api/analytics/vibe-score", 200)
        if not success:
            return False

        # Get analytics summary
        success, _ = self.run_test("Get Analytics Summary", "GET", "api/analytics/summary", 200)
        return success

    def test_ai_coach(self):
        """Test AI coach endpoint"""
        success, response = self.run_test(
            "AI Coach",
            "POST",
            "api/ai/coach",
            200,
            data={"message": "Hello, how are you?", "session_id": "test-session"}
        )
        if success and 'response' in response:
            print(f"   AI Response: {response['response'][:100]}...")
        return success

    def test_challenges(self):
        """Test challenges endpoints"""
        # Get challenges
        success, challenges = self.run_test("Get Challenges", "GET", "api/challenges", 200)
        if not success:
            return False

        if challenges and len(challenges) > 0:
            challenge_id = challenges[0]['id']
            
            # Join challenge
            success, _ = self.run_test(f"Join Challenge", "POST", f"api/challenges/{challenge_id}/join", 200)
            if not success:
                return False

            # Check-in to challenge
            success, _ = self.run_test(f"Challenge Check-in", "POST", f"api/challenges/{challenge_id}/checkin", 200)
            return success
        
        return True

    def test_profile(self):
        """Test profile endpoints"""
        # Get profile
        success, _ = self.run_test("Get Profile", "GET", "api/profile", 200)
        if not success:
            return False

        # Update profile
        success, _ = self.run_test(
            "Update Profile",
            "PUT",
            "api/profile",
            200,
            data={"name": "Updated Test User", "bio": "Test bio"}
        )
        return success

    def test_quote(self):
        """Test daily quote endpoint"""
        return self.run_test("Get Daily Quote", "GET", "api/quote", 200, auth_required=False)

    def test_onboarding(self):
        """Test onboarding endpoint"""
        success, _ = self.run_test(
            "Complete Onboarding",
            "POST",
            "api/onboarding",
            200,
            data={
                "fitness_level": "intermediate",
                "wellness_goals": ["lose_weight", "better_sleep"],
                "selected_habits": ["Drink Water", "Exercise", "Meditate"]
            }
        )
        return success

    def test_social_feed(self):
        """Test social feed endpoints"""
        # Get feed
        success, feed = self.run_test("Get Feed", "GET", "api/feed", 200)
        if not success:
            return False

        # Create post
        success, post = self.run_test(
            "Create Feed Post",
            "POST",
            "api/feed",
            200,
            data={"content": "Test post from API testing", "post_type": "update"}
        )
        if not success or 'id' not in post:
            return False

        post_id = post['id']

        # Like post
        success, like_response = self.run_test(f"Like Post", "POST", f"api/feed/{post_id}/like", 200)
        if not success:
            return False

        # Unlike post (toggle)
        success, unlike_response = self.run_test(f"Unlike Post", "POST", f"api/feed/{post_id}/like", 200)
        if not success:
            return False

        # Share vibe card
        success, vibe_post = self.run_test("Share Vibe Card", "POST", "api/feed/share-vibe", 200)
        return success

def main():
    print("🚀 Starting Vibly API Tests...")
    tester = ViblyAPITester()

    # Test health check first
    if not tester.test_health_check()[0]:
        print("❌ Health check failed, stopping tests")
        return 1

    # Test registration or login
    if not tester.test_register():
        print("⚠️ Registration failed, trying login...")
        if not tester.test_login():
            print("❌ Both registration and login failed, stopping tests")
            return 1

    # Run all tests
    test_methods = [
        tester.test_get_me,
        tester.test_onboarding,
        tester.test_habit_templates,
        tester.test_habits_crud,
        tester.test_goals_crud,
        tester.test_vitals,
        tester.test_analytics,
        tester.test_ai_coach,
        tester.test_challenges,
        tester.test_social_feed,
        tester.test_profile,
        tester.test_quote
    ]

    for test_method in test_methods:
        try:
            test_method()
        except Exception as e:
            print(f"❌ Test {test_method.__name__} crashed: {str(e)}")
            tester.failed_tests.append({
                "test": test_method.__name__,
                "error": str(e)
            })

    # Print results
    print(f"\n📊 Test Results:")
    print(f"   Tests run: {tester.tests_run}")
    print(f"   Tests passed: {tester.tests_passed}")
    print(f"   Tests failed: {tester.tests_run - tester.tests_passed}")
    print(f"   Success rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%")

    if tester.failed_tests:
        print(f"\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            print(f"   - {failure['test']}: {failure.get('error', 'Status code mismatch')}")

    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())