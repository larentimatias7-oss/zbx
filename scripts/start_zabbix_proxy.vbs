Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "node.exe C:\zabbix_anti\scripts\zabbix_proxy_daemon.mjs", 0, False
