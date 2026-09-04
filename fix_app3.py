import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'import \{ OtpNotificationBanner \} from \'\./components/OtpNotificationBanner\';\n', '', content)
content = re.sub(r'\{/\* ⭐ TOP SIMULATED OTP NOTIFICATION BANNER ⭐ \*/\}.*?<OtpNotificationBanner />', '', content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)
