import language_tool_python

tool = language_tool_python.LanguageTool('en-US')
text = "Hello my name is shreya and I am builloding an AI voice project."

matches = tool.check(text)
print(f"Found {len(matches)} issues:")
for m in matches:
    print(f"  Rule: {m.rule_id}")
    print(f"  Word: '{text[m.offset:m.offset+m.error_length]}'")
    print(f"  Suggestions: {m.replacements[:3]}")
    print()

corrected = language_tool_python.utils.correct(text, matches)
print(f"Auto corrected: {corrected}")
tool.close()