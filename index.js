addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // 构建要请求的 URL
  const url = 'https://moistr.freenods.sbs/free?host=ybvlgv.aadd.cloudns.ch&uuid=3a037855-1f8f-4f7d-8917-60698f9556ff';

  // 发送请求
  const response = await fetch(url);

  if (!response.ok) {
    return new Response('Failed to fetch data', { status: response.status });
  }

  // 读取响应的内容
  const data = await response.text();

  // 解码响应的内容
  const decodedData = decodeURIComponent(atob(data));

  // 使用正则表达式从解码后的响应中提取 IP 和端口
  const matches = decodedData.match(/@(\d+\.\d+\.\d+\.\d+):(\d+)/g);

  if (!matches) {
    return new Response('No IP and port found', { status: 404 });
  }

  // 提取的 IP 和端口
  const ipPorts = matches.map(match => match.slice(1)); // 去掉开头的@

  // 获取每个IP地址的地理位置，并添加到IP和端口后面
  const ipPortsWithRegion = await Promise.all(ipPorts.map(async (ip, index) => {
    const [ipAddress, port] = ip.split(':');
    const region = await getRegion(ipAddress);
    return `${ipAddress}:${port}#${region !== 'Unknown' ? region : `Unknown${index + 1}`}`;
  }));

  // 将 IP、端口和区域以换行分隔的形式返回
  const ipPortsText = ipPortsWithRegion.join('\n');

  // 返回结果
  return new Response(ipPortsText, {
    headers: { 'Content-Type': 'text/plain' }
  });
}

async function getRegion(ip) {
  try {
    // 使用另一个IP地址解析服务来获取地理区域信息
    const response = await fetch(`https://ipinfo.io/${ip}/json`);
    const data = await response.json();
    if (response.ok) {
      // 返回地理区域的国家代码
      return data.country ? data.country : 'Unknown';
    } else {
      console.error('Failed to fetch region:', data.error);
      return 'Unknown';
    }
  } catch (error) {
    console.error('Failed to fetch region:', error);
    return 'Unknown';
  }
}