//计时开始
t1 = new Date(); //创建"then"这个日期/时间对像
t1.setTime(t1.getTime()); //为这个对象赋值

var canvas = document.getElementById("canvas");
var canvasWidth = canvas.width;
var canvasHeight = canvas.height;
var context = canvas.getContext("2d");

var N = 30; //城市数量
var M = 120; //蚂蚁数量

var inittao = 1; //初始路径激素量
var tao; //[N][N];     //N*N矩阵——表示i和j间残留的激素信息量, 初始化为常熟C（各路径相等），以表示激素的挥发
var yita; //[N][N];      //N*N矩阵——表示i和j间由举例所决定的选择概率矩阵
var delta_tao; //[N][N]; //一轮循环后增加的信息素
var distant; //[N][N];   //所有城市间的距离
var tabu; //[M][N];         //禁忌表
var route; //[M][N];        //M只蚂蚁所走过的路径
var solution; //[M];     //对M只蚂蚁所走过路径的适应度评价值
var BestRoute; //[N];       //最忌路径
var BestSolution = 10000000000; //设置的极限最大路径
var alfa, beta, rou, Q; //路径激素更新数量
var NcMax; //蚁群最大迭代次数

function initMat(M, N, val) {
  var x = new Array();
  for (var i = 0; i < M; i++) {
    x[i] = new Array();
    for (var j = 0; j < N; j++) x[i].push(val);
  }
  return x;
}

function initAllMats() {
  tao = initMat(N, N, 0);
  yita = initMat(N, N, 0);
  delta_tao = initMat(N, N, 0);
  distant = initMat(N, N, 0);
  tabu = initMat(M, N, 0);
  route = initMat(M, N, -1);

  solution = new Array();
  for (var i = 0; i < M; i++) solution[i] = 0;

  BestRoute = new Array();
  for (var i = 0; i < N; i++) BestRoute[i] = -1;
}

//初始化城市的位置
function InCityXY(x, y) {
  for (var i = 0; i < N; i++) {
    x[i] = ((Math.random() * 32767) % 980) + 20;
    y[i] = ((Math.random() * 32767) % 420) + 20;
  }
}

//初始化算法参数
function initparameter() {
  alfa = 1; //积累的激素调节因子作用系数
  beta = 5; //启发性调节因子作用系数
  rou = 0.9;
  Q = 100; //常量
  NcMax = 200; //群蚂蚁进化代数
}

//取得某个路径的长度
function EvalueSolution(a) {
  var dist = 0;
  for (var i = 0; i < N - 1; i++) dist += distant[a[i]][a[i + 1]];
  dist += distant[a[N - 1]][a[0]];
  return dist;
}

function drawCities(x, y) {
  for (var i = 0; i < N; i++) {
    context.beginPath();

    context.fillStyle = "blue";
    context.strokeStyle = "blue";
    context.lineWidth = 1;
    context.font = "normal 16px Arial";

    context.arc(
      x[i],
      y[i],
      3,
      (Math.PI / 180) * 0,
      (Math.PI / 180) * 360,
      false
    );
    context.fill();
    context.stroke();
    context.closePath();
    /*  
        context.fillStyle = "white";  
        context.textAlign = "center";  
        context.textBaseline = "middle";  
        context.fillText(String(i), x[i], y[i]);  
*/
  }
}

function drawPath(x1, y1, x2, y2, color, width) {
  context.beginPath();
  context.fillStyle = color;
  context.strokeStyle = color;
  context.lineWidth = width;
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
}

//主函数
function ACA_TSP() {
  var NC = 0;
  //初始化算法参数
  initparameter();

  //初始化城市的位置
  var x = new Array();
  var y = new Array();
  for (var i = 0; i < N; i++) {
    x.push(0);
    y.push(0);
  }
  //初始化城市位置
  InCityXY(x, y);

  //计算任意两城市间的距离
  for (var i = 0; i < N; i++)
    for (var j = i + 1; j < N; j++) {
      distant[j][i] = Math.sqrt(
        (x[i] - x[j]) * (x[i] - x[j]) + (y[i] - y[j]) * (y[i] - y[j])
      );
      distant[i][j] = distant[j][i];
    }
  // calculate the heuristic parameters
  var i, j, k;
  //初始化任意两点间的选择可能性程度=1-p
  //若i==j，则p=1
  //否则，p=100/distant[i][j]
  for (i = 0; i < N; i++)
    for (j = 0; j < N; j++) {
      tao[i][j] = inittao;
      if (j != i) yita[i][j] = 100 / distant[i][j]; //值越大，i到j被选择的路径概率越大; 或者说，i和j距离越近，被选择的概率越大
    }
  //初始化M个蚂蚁走完所有城市(N)的路径
  //-1表示第k只蚂蚁尚没有从当前位置走向i城市
  /*  
    for(k=0;k<M;k++)   
        for(i=0;i<N;i++)   
            route[k][i] =- 1;   
    */
  //初始化所有蚂蚁的禁忌表
  for (k = 0; k < M; k++) {
    route[k][0] = k % N; //随机置放蚂蚁的第一站城市点---此代码实际上没有随机摆放
    tabu[k][route[k][0]] = 1; //设置禁忌表的已访问过的城市为1
  }
  //所有蚂蚁行走NcMax趟
  do {
    var s = 1;
    var partsum;
    var pper;
    var drand;

    //s循环N次，让每只蚂蚁走N步，走完全程
    while (s < N) {
      for (k = 0; k < M; k++) {
        var jrand = (Math.random() * 32767) % 3000;
        drand = jrand / 3001.0;
        partsum = 0;
        pper = 0;
        for (j = 0; j < N; j++) {
          if (tabu[k][j] == 0)
            partsum +=
              Math.pow(tao[route[k][s - 1]][j], alfa) *
              Math.pow(yita[route[k][s - 1]][j], beta);
        }
        for (j = 0; j < N; j++) {
          if (tabu[k][j] == 0)
            pper +=
              (Math.pow(tao[route[k][s - 1]][j], alfa) *
                Math.pow(yita[route[k][s - 1]][j], beta)) /
              partsum;
          if (pper > drand) break;
        }
        tabu[k][j] = 1;
        route[k][s] = j;
      }
      s++;
    }
    // the pheromone is updated
    for (i = 0; i < N; i++) for (var j = 0; j < N; j++) delta_tao[i][j] = 0;
    //记录最短路径及其长度
    for (k = 0; k < M; k++) {
      solution[k] = EvalueSolution(route[k]);
      if (solution[k] < BestSolution) {
        BestSolution = solution[k];
        for (s = 0; s < N; s++) BestRoute[s] = route[k][s];
      }
    }
    //根据上一批次（M个蚂蚁）所求路径的长度信息，更新从i到j的选择概率
    for (k = 0; k < M; k++) {
      for (s = 0; s < N - 1; s++)
        delta_tao[route[k][s]][route[k][s + 1]] += Q / solution[k];
      delta_tao[route[k][N - 1]][route[k][0]] += Q / solution[k];
    }
    //计算NxN个节点间的转移概率，并设置最大与最小值
    for (i = 0; i < N; i++)
      for (var j = 0; j < N; j++) {
        tao[i][j] = rou * tao[i][j] + delta_tao[i][j];
        if (tao[i][j] < 0.00001) tao[i][j] = 0.00001;
        if (tao[i][j] > 20) tao[i][j] = 20;
      }
    //重新设置所有蚂蚁的禁忌表和路径信息
    for (k = 0; k < M; k++)
      for (var j = 1; j < N; j++) {
        tabu[k][route[k][j]] = 0;
        route[k][j] = -1;
      }
    NC++;
  } while (NC < NcMax);
  //output the calculating outs
  /*  
    print("*针对旅行商问题的蚂蚁克隆算法*");   
    print("初始参数：");   
    print("alfa=" + alfa + ", beta=" + beta + ", rou=" + rou + ", Q=" + Q);   
    print("蚁群探索循环次数:" + NcMax);  
    print("最短路径是:" + BestSolution);  
    print("最佳路径是:");   
    */
  for (i = 0; i < N; i++) {
    if (i == N - 1) j = 0;
    else j = i + 1;
    var nodeA = BestRoute[i];
    var nodeB = BestRoute[j];
    var x1 = x[nodeA];
    var y1 = y[nodeA];
    var x2 = x[nodeB];
    var y2 = y[nodeB];
    drawPath(x1, y1, x2, y2, "black", 2);
  }
  drawCities(x, y);

  var out = document.getElementById("outText");
  out.innerHTML = "<h1>蚂蚁克隆算法求解旅行商问题: </h1>最佳路径:<br/>";
  for (i = 0; i < N; i++)
    out.innerHTML = out.innerHTML + String(BestRoute[i]) + " ";
  out.innerHTML = out.innerHTML + "<br/>最短路径长度:<br/>" + BestSolution;
}

//调用上述函数
initAllMats();
ACA_TSP();

//结束后,取得现在时间, 并计算时间差
t2 = new Date(); //创建"then"这个日期/时间对像
var ms = t2.getTime() - t1.getTime();
var out = document.getElementById("outText");
out.innerHTML = out.innerHTML + "<br/>用时(毫秒):<br/>" + ms;
