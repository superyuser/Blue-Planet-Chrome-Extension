import requests

url = input("Url: ")

response = requests.get(url)

with open("hehe.png", "wb") as f:
    f.write(response.content)
