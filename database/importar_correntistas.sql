-- Importação do extrato de correntistas para MySQL.
-- Apaga os registros atuais SOMENTE de contas_receber e clientes e recarrega os dados da planilha.
-- Faça backup antes de executar. Rode com a opção de parar ao primeiro erro; se algum comando falhar, execute ROLLBACK imediatamente.
-- Os clientes duplicados com mesmo nome e telefone foram consolidados.
START TRANSACTION;
DELETE FROM contas_receber;
DELETE FROM clientes;

INSERT INTO clientes (nome, telefone, usuario_criacao) VALUES
('Abner Gabriel', '(41) 99846-9878', 3),
('Acassio', '(11) 95922-3233', 3),
('Ademir Schuindt', '(44) 9980-2930', 3),
('Adenilto Silva Lopes - Dê', '(44) 99762-3102', 3),
('Adilson Tabacaria', '(44) 99768-0573', 3),
('Adriano Gonçalves de Oliveira', '(44) 99980-6077', 3),
('Adriele (Coamo)', '(44) 99997-6999', 3),
('Adriele Freitas Domingues', '(44) 99916-9649', 3),
('Adrielli Ramos de Oliveira', '(44) 99979-8529', 3),
('Agnaldo Segurança', '(44) 99868-3691', 3),
('Alan - Elano', '(44) 99860-6368', 3),
('Alan Batista (Vereador)', '(44) 99960-4418', 3),
('Alessandro Rodrigues', '(44) 99802-8990', 3),
('Alex C. Ferreira', '(44) 99737-8753', 3),
('Alex Mazzo', '(44) 99868-5847', 3),
('Alexandre Donato', '(44) 98814-2821', 3),
('Aline dos Santos', '(44) 99818-9065', 3),
('Aline Karolayne - Deyse', '(44) 99992-4644', 3),
('Aline Olinda', '(44) 99852-8564', 3),
('Aline Paviane', '(44) 99986-2199', 3),
('Aline Vitória', '(41) 99768-1970', 3),
('Alison Vieira', '(41) 9619-1458', 3),
('Amanda Ghirottho', '(44) 99724-6220', 3),
('Amaro Pinheiro da Silva', '(44) 99988-2469', 3),
('Ana Heloisa', '(21) 2213-1212', 3),
('Ana Paula (Bico)', '(44) 99885-1744', 3),
('Ana Paula Jorge', '(44) 99959-0851', 3),
('Ana Paula Pereira (Coamo)', '(44) 99846-0990', 3),
('Anderson (Hortifruti)', '(44) 99927-2620', 3),
('Andre Pangare', '(44) 99892-2750', 3),
('André Santa Lucia', '(44) 99908-7729', 3),
('Andreia Pereira', '(44) 99852-1723', 3),
('Andressa (Benjamin)', '(44) 99836-3844', 3),
('Andrey Jacson', '(44) 99853-5691', 3),
('Anselmo Mendes', '(44) 99923-4364', 3),
('Anthonia Risti da Costa', '(44) 99900-1870', 3),
('Anthony', '(44) 99934-2843', 3),
('Antonio Leite - Cido', '(44) 99949-9174', 3),
('Any Karoline', '(44) 99803-6588', 3),
('Batista - Jaine', '(44) 99900-8558', 3),
('Beatriz de Oliveira Marques', '(44) 99831-8120', 3),
('Beatriz Paulo', '(44) 99908-1001', 3),
('Bek', '(44) 99847-7626', 3),
('Benedita A. Pinheiro - Dita', '(44) 99720-5672', 3),
('Bianca Rafhaela', '(44) 9921-1479', 3),
('Bico', '(44) 9900-6025', 3),
('Camila Rezende', '(44) 99835-6423', 3),
('Camilla Santiago', '(44) 99713-9982', 3),
('Carlos Alves - Coaprocor - Maiza', '(44) 99833-1345', 3),
('Cassiana da Silva', '(44) 99868-5225', 3),
('Cassil Velten', '(44) 99999-7631', 3),
('Cauã Elpidio de Oliveira', '(44) 99850-7203', 3),
('Cesar pai do Julio', '(44) 99756-3814', 3),
('Claudete Andre Pimenta Mendes', '(44) 99885-0453', 3),
('Claudinei Theodoro', '(41) 9946-9325', 3),
('Claudiney Ricardo', '(44) 99829-4295', 3),
('Claudio Ferreira', '(44) 99826-5232', 3),
('Claudio Pimenta', '(44) 99807-2469', 3),
('Claudio Sanepar', '(44) 99940-9731', 3),
('Cleide Boina', '(44) 99725-5299', 3),
('Cleusa Fagundes Miranda Francisco', '(43) 99622-7429', 3),
('Clotilde Ghirottho', '(44) 99806-2037', 3),
('Cristina Ramos de Oliveira', '(44) 9903-0419', 3),
('Daiane Amaral', '(44) 99966-4361', 3),
('Daniel de Jesus (da Vila)', '(44) 99748-0977', 3),
('David Henrique Campos', '(44) 9976-4160', 3),
('Débora Cristina Ribeiro Gonçalves (Conselho)', '(44) 99995-3096', 3),
('Denilze Fereira', '(41) 99761-0397', 3),
('Dheime Layra da Silva', '(19) 99350-0494', 3),
('Diogo Rafael Nunes', '(44) 99747-5100', 3),
('Diogo Souza Campos', '(44) 99832-6735', 3),
('Dione Martins Gomes', '(44) 99948-3543', 3),
('Dirlei Antunes (Misturinha)', '(44) 99883-4193', 3),
('Doda - Clodomir Lopes', '(44) 99764-4056', 3),
('Domênica de Souza', '(44) 99980-6345', 3),
('Dorival Gobo', '(44) 99672-7099', 3),
('Dr. Maurillio R. Saturnino', '(44) 99719-4403', 3),
('Dudu - Loana Trindade', '(44) 99835-5539', 3),
('Duli - Campos', '(44) 99999-1234', 3),
('Edinha Tavares', '(44) 99906-7464', 3),
('Edinho', '(41) 99824-3610', 3),
('Edna Teodoro dos Santos - Junior Pipoca', '(44) 99820-8444', 3),
('Edson Manoel', '(44) 99921-0932', 3),
('Edson Willian da Costa', '(44) 99811-5890', 3),
('Eduarda Portella', '(44) 9841-5295', 3),
('Eduardo Aparecido Baia', '(44) 99776-0301', 3),
('Eduardo Gobo', '(44) 99766-7615', 3),
('Eduardo Marcelo Umbelino', '(44) 99881-3135', 3),
('Eduardo Souza', '(44) 99925-4075', 3),
('Eliana Aparecida Santos de Souza', '(44) 99760-4339', 3),
('Eliandro Sita', '(44) 99898-8525', 3),
('Eliane Aparecida Baguete Lopes (Feirinha)', '(44) 99950-8617', 3),
('Eliane Silva', '(44) 99818-8189', 3),
('Eliel Justino de Souza', '(44) 99965-2644', 3),
('Elizangela Cafissi', '(44) 99926-3385', 3),
('Emerson (Baiano)', '(44) 99702-9058', 3),
('Emerson dos Santos (Nene)', '(44) 99960-5782', 3),
('Emerson Pereira Machado', '(44) 99860-4193', 3),
('Emyllin', '(44) 99710-9121', 3),
('Enzo Lacerda', '(11) 95927-3069', 3),
('Érica Eduarda Campos', '(44) 99866-5341', 3),
('Esteffany Vitoria', '(44) 99992-4414', 3),
('Ester Themistocles', '(44) 99903-7462', 3),
('Evandro - Barbosa Ferraz', '(44) 99860-3105', 3),
('Everton (irmão da Caila)', '(44) 99712-4552', 3),
('Everton do Jiro', '(44) 99943-7117', 3),
('Everton Lucas', '(44) 99770-7560', 3),
('Fabio Cras', '(44) 99893-3934', 3),
('Feche de Lenha', '(44) 12345-1234', 3),
('Fernanda Piza', '(44) 99998-4182', 3),
('Fernanda Portella', '(44) 9848-1984', 3),
('Fernanda Ventura', '(44) 99711-1070', 3),
('Fernando Artiles', '(44) 99898-5940', 3),
('Flavia Nair Paulo', '(44) 99979-1547', 3),
('Fran / Telso', '(44) 99930-1356', 3),
('Fran Pertenelli', '(44) 99734-1057', 3),
('Frank Santos', '(44) 99847-2323', 3),
('Gabriel Fabricio Barbosa  Pontes', '(44) 99740-9141', 3),
('Gabriela Evangelista Costa', '(44) 99911-6911', 3),
('Gaby', '(44) 99950-8668', 3),
('Geni Fiorderize', '(44) 99926-1606', 3),
('Geovana', '(44) 99745-6414', 3),
('Gilmar Rodrigues Fernades', '(44) 99817-3516', 3),
('Gisele Ramos', '(44) 99996-9300', 3),
('Givanilda Schuindts', '(44) 99980-2930', 3),
('Gleicymaira', '(44) 9737-6674', 3),
('Gleycymeire', '(44) 99740-9021', 3),
('Graciely Sangy Salema', '(44) 93300-8601', 3),
('Guilherme Bonifácio', '(44) 99970-3351', 3),
('Guilherme Galeriani Neto', '(44) 9922-1784', 3),
('Gustavo Lima Serafim', '(44) 99998-4249', 3),
('Gustavo Morais', '(41) 99630-1244', 3),
('Hediane Ventura', '(44) 99713-3149', 3),
('Helen Cawani del Antonio da Silva', '(44) 98825-0631', 3),
('Helen Cristina Martins', '(44) 99703-4688', 3),
('Helenice Aguiar França', '(44) 99824-8586', 3),
('Hélio Bueno', '(44) 99736-6079', 3),
('Hellen', '(44) 9839-6067', 3),
('Heloisa', '(44) 99757-6299', 3),
('Henrique Evaristo', '(44) 99896-3247', 3),
('Henrique Silva / Thamires', '(44) 99901-6108', 3),
('Hugo Bergossi', '(44) 99832-6083', 3),
('Inácio Andrade', '(44) 99769-8260', 3),
('Ingridy Mikaely', '(44) 99840-3580', 3),
('Irene Pereira de Oliveira', '(44) 99909-7883', 3),
('Itacir de Souza Campos', '(44) 99919-4194', 3),
('Ivan Lobo', '(44) 99731-4560', 3),
('Ivone Bergossi', '(44) 99996-3134', 3),
('Jaine Lopes', '(44) 99912-3204', 3),
('Jair Baguete', '(44) 99829-7282', 3),
('Janaina Clemente da Silva', '(44) 99843-3832', 3),
('Janderson Françoso', '(44) 99812-1155', 3),
('Jaqueline / Danilo', '(44) 99708-4119', 3),
('Jaqueline Fernandes', '(44) 99857-5473', 3),
('Jean Carrero', '(44) 99743-2926', 3),
('Jessica / Prix', '(44) 99711-9885', 3),
('Jessica Ramos', '(44) 99986-6399', 3),
('Jessyca Candido de Araujo (Célio)', '(44) 99858-7329', 3),
('Jesus Borges', '(44) 9940-9503', 3),
('Jheiny Picanso', '(44) 99839-4302', 3),
('Jhonata Willians de Oliveira', '(44) 99960-4281', 3),
('João Batista da Silva', '(44) 99978-8441', 3),
('João Lucas', '(43) 99803-3805', 3),
('Joelcio - Marcia', '(44) 99867-8027', 3),
('Johnathan Cardoso', '(44) 99902-5274', 3),
('José Adão', '(44) 99707-7004', 3),
('José Antônio (Zé da Lia)', '(44) 99727-4018', 3),
('Josekely Fernandes Zufa Cafissi', '(44) 99748-5434', 3),
('Josiane Perez Strenske', '(44) 99875-0213', 3),
('Josiel Amaral Cunha', '(44) 99809-9643', 3),
('Jucilei / Vandelei (Coamo)', '(44) 99846-6943', 3),
('Julia Boina', '(44) 99996-2826', 3),
('Julia Gouveia', '(44) 99950-8707', 3),
('Julio de Sa', '(44) 99851-4228', 3),
('Junior Nogueira / Stefhany', '(44) 99804-9237', 3),
('Juraci Berti kissilevicht', '(44) 99752-7724', 3),
('Kalliana', '(44) 99824-2364', 3),
('Karina Ap. de Oliv. Afonso / Alex', '(44) 99908-7419', 3),
('Kauane Ap. da Silva', '(44) 99827-5638', 3),
('Kawan', '(44) 99122-2779', 3),
('Kelly Paluch / Janderson', '(41) 99621-3436', 3),
('Kemilly Kawanny', '(44) 99991-7793', 3),
('Késia Neves', '(44) 99732-1243', 3),
('Ketlin', '(44) 9703-5007', 3),
('Laura', '(44) 99713-3638', 3),
('Layane Negreiros Cremonezzi', '(44) 99915-9909', 3),
('Leiziane Rodrigues Avelar', '(44) 99744-9339', 3),
('Leomar Delfino', '(44) 99815-7068', 3),
('Letícia Donato', '(44) 99729-9987', 3),
('Leticia Pires de Souza', '(41) 99821-2109', 3),
('Letycia França', '(44) 99978-8815', 3),
('Lorena Paulo', '(44) 9701-2825', 3),
('Luana Gabriel Valentina', '(44) 99969-7205', 3),
('Lucas de Andrade Umbelino', '(44) 99735-3151', 3),
('Lucas Gabriel Antunes', '(44) 99905-9697', 3),
('Lucas Nespolo Oliveira (Profª Gislaine)', '(44) 99776-1297', 3),
('Lucas Pikler', '(44) 99805-6684', 3),
('Luciana de Oliveira', '(44) 99711-9162', 3),
('Luciana Polido', '(44) 99876-6370', 3),
('Luciano Matias Pedroso', '(44) 9987-4034', 3),
('Madalena', '(44) 99912-7559', 3),
('Maiara Aparecida Lopes (May)', '(44) 99711-1662', 3),
('Marcelo (Coaprocor)', '(41) 99672-1720', 3),
('Marcelo Henrique Bonifacio da Silva', '(44) 99700-3735', 3),
('Marcia Amurin', '(44) 99929-2678', 3),
('Marcia Picanço', '(44) 99818-4519', 3),
('Marciana', '(44) 99811-1353', 3),
('Marcos dos Santos Leite', '(44) 9830-8384', 3),
('Marcos Paim', '(44) 99914-8728', 3),
('Marcos Rogério de Souza', '(44) 99806-3508', 3),
('Marcos Sanches', '(44) 99992-9996', 3),
('Marcos Santiago', '(44) 99856-1097', 3),
('Maria Angela', '(44) 99904-9179', 3),
('Maria Caila', '(44) 99748-9956', 3),
('Maria de Fatima de Oliveira', '(44) 99804-0036', 3),
('Maria Monica Bonifácio', '(44) 99877-3629', 3),
('Maria Rita Baia', '(44) 99739-1498', 3),
('Mateus Fernando da Silva', '(44) 99834-8347', 3),
('Matheus Alixandre Rodrigues', '(44) 99809-2836', 3),
('Matheus Henrique Deber', '(44) 99953-2243', 3),
('Mauricio Ghirottho', '(44) 99770-3316', 3),
('Mauro Sergio', '(44) 9969-2923', 3),
('Mayra / Farmacia', '(44) 99725-6926', 3),
('Micheli Fernanda A. I. Lopes', '(44) 99999-9864', 3),
('Miguel Arcanjo', '(44) 99734-4137', 3),
('Milena Gouveia', '(44) 99933-3762', 3),
('Milene Oliveira Bezerra dos Nascimento dos Reis', '(44) 99945-8846', 3),
('Mirian Vó do Caue', '(44) 9982-7474', 3),
('Moisés Vesphal', '(44) 99983-0635', 3),
('Murilo Bergossi', '(44) 99713-1189', 3),
('Murilo Moreira - Filho da  Andreia Borges', '(44) 99901-6507', 3),
('Murilo Rodrigues de Lima / Durval', '(44) 9995-1795', 3),
('Nedson da Silva', '(44) 99809-5834', 3),
('Neguinho', '(44) 99967-8842', 3),
('Neia da Loja', '(44) 99858-5357', 3),
('Nelzira / Rui', '(44) 99722-3719', 3),
('Neusa Opidio', '(44) 99727-1954', 3),
('Neuza Rezende', '(44) 99701-9204', 3),
('Numero Desconhecido', '(44) 99855-2631', 3),
('Osiel Andrade', '(44) 99736-3173', 3),
('Osney Picanço', '(44) 99982-5202', 3),
('Ozana Gonçalves Mendes Morales', '(44) 99892-3110', 3),
('Paloma Silva', '(44) 99760-1773', 3),
('Paschoal Cafisso', '(44) 99104-4749', 3),
('Patrícia / Binho', '(44) 99748-9846', 3),
('Patricia Goes', '(44) 99999-7334', 3),
('Paula', '(44) 99802-4230', 3),
('Pedro Henrique Melo dos Anjos', '(44) 99985-4150', 3),
('Pref. Munic. Corumb. do Sul', '(44) 3277-1153', 3),
('Rafael Borges', '(44) 99768-1608', 3),
('Rafael Cardoso (Rafinha)', '(41) 99783-7132', 3),
('REINALDO THEMISTOCLES', '(44) 99855-2630', 3),
('Renaldo Galli', '(44) 9922-2499', 3),
('Renata Carvalho Sita', '(44) 99869-4199', 3),
('Ricardo Carvalho', '(44) 99955-1749', 3),
('Ricardo Diniz', '(44) 8827-7639', 3),
('Rildo Aparecido Marins', '(44) 9725-8858', 3),
('Roberta Thaila Ap. de Oliveira', '(44) 99717-4298', 3),
('Roberto (Tatá)', '(44) 99898-0530', 3),
('Roberto Davanço - Juninho Zoinho', '(44) 99803-9617', 3),
('Rodrigo Costa', '(44) 99960-8725', 3),
('Rosana Moreira Bueno', '(00) 0000-0000', 3),
('Rosane Camilo', '(41) 99832-9757', 3),
('Rosangela Baguete', '(44) 9909-1052', 3),
('Rosimary Rodrigues Lima - Rose', '(44) 99914-0747', 3),
('Ruan', '(44) 99754-3173', 3),
('Sabrina Andrade', '(44) 99958-6828', 3),
('Samilly Julia Miguel', '(44) 99718-4697', 3),
('Samuel Morais', '(44) 99737-4694', 3),
('Sandra (Coamo)', '(44) 99909-2128', 3),
('Sandra Aguinelo', '(44) 99749-3926', 3),
('Sandra Bergossi', '(44) 99722-0564', 3),
('Sandra Ferreira da Costa', '(44) 99840-4039', 3),
('Sandro Alviano - Correios', '(44) 99968-7564', 3),
('Sandro Fernandes de Souza', '(44) 99905-2113', 3),
('Sarah Teodoro', '(44) 99999-7039', 3),
('Saulo', '(44) 99901-3979', 3),
('Sérgio Santos', '(44) 99803-3395', 3),
('Seu Luiz', '(44) 99114-1213', 3),
('Sheron', '(44) 99819-2038', 3),
('Shirley Alviano', '(44) 99826-4147', 3),
('Sidnei Junior Pires', '(44) 92004-6126', 3),
('Sidneia', '(44) 99973-0903', 3),
('Silvana - Bigula - Via Carnes', '(44) 99889-4513', 3),
('Simone Santana', '(41) 99846-4475', 3),
('Sonia Oliveira Sita', '(44) 99950-2947', 3),
('Stefany Kovalski Urias', '(44) 99757-3397', 3),
('Suele Ribeiro Jacomeli', '(41) 99859-4457', 3),
('Tais Robust', '(44) 99917-8034', 3),
('Talita', '(44) 99702-3179', 3),
('Tarcízio Paulo', '(44) 99917-3210', 3),
('Tatiana Theodoro da Silva', '(44) 99999-4399', 3),
('Tatti Aguiar', '(44) 99910-9240', 3),
('Thais Viviane Balbino Morais', '(44) 99930-0869', 3),
('Thiago Barbosa', '(44) 99825-4129', 3),
('Thiago Serrinha', '(11) 98235-4923', 3),
('Tiago Martins da Silva', '(44) 9994-4596', 3),
('Tiago Morello Morales', '(44) 99925-8169', 3),
('Tino', '(44) 99865-7418', 3),
('Valdemir dos Santos - Fiote', '(44) 99876-8157', 3),
('Valdinei Teixeira de Souza', '(44) 99835-7206', 3),
('Valdineia Aparecida de Oliveira', '(44) 99956-5937', 3),
('Valdomiro Lacos', '(44) 99813-6327', 3),
('Valquíria Balbino', '(44) 99953-7043', 3),
('Vanessa (Loja Rosa Liz)', '(44) 99826-9528', 3),
('Vanessa Mendes', '(44) 99991-2013', 3),
('Vania da Silva - Cresol', '(44) 99944-0610', 3),
('Vera Lúcia de Souza', '(44) 99986-5566', 3),
('Victor (Sicred)', '(44) 99726-9349', 3),
('Victor Hugo Holowka', '(44) 99764-3527', 3),
('Vidal', '(44) 9816-3129', 3),
('Vinicius Henrique da Silva', '(44) 99917-7544', 3),
('Vitor Kauã de Oliveira Souza  - Sobrinho', '(44) 99887-3063', 3),
('Vózinha', '(44) 99993-8188', 3),
('Wallison Geraldo da Costa', '(44) 99944-8572', 3),
('Welington Egídio', '(44) 99854-4774', 3),
('Weliton Costa', '(44) 99973-7103', 3),
('Willian Mariano', '(44) 99963-9760', 3),
('Zeli Lopes', '(44) 99996-1307', 3),
('Zilmara Tatiane de Camargo Gonalves', '(44) 99892-2738', 3);

-- Contas criadas apenas para linhas com valor positivo em 'A Pagar'.
INSERT INTO contas_receber (cliente_id, usuario_criacao, descricao, valor_original, data_vencimento, data_emissao)
SELECT c.id, 3, 'Saldo a pagar - extrato de correntistas', d.valor, DATE_ADD(CURDATE(), INTERVAL 30 DAY), CURDATE()
FROM (
  SELECT 'Ademir Schuindt' AS nome, '(44) 9980-2930' AS telefone, CAST(73.49 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Adenilto Silva Lopes - Dê' AS nome, '(44) 99762-3102' AS telefone, CAST(164.50 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Adilson Tabacaria' AS nome, '(44) 99768-0573' AS telefone, CAST(80.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Adriele (Coamo)' AS nome, '(44) 99997-6999' AS telefone, CAST(577.59 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Adriele Freitas Domingues' AS nome, '(44) 99916-9649' AS telefone, CAST(64.50 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Agnaldo Segurança' AS nome, '(44) 99868-3691' AS telefone, CAST(27.50 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Alan - Elano' AS nome, '(44) 99860-6368' AS telefone, CAST(22.50 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Alessandro Rodrigues' AS nome, '(44) 99802-8990' AS telefone, CAST(60.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Alexandre Donato' AS nome, '(44) 98814-2821' AS telefone, CAST(338.50 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Aline dos Santos' AS nome, '(44) 99818-9065' AS telefone, CAST(35.49 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Aline Karolayne - Deyse' AS nome, '(44) 99992-4644' AS telefone, CAST(732.27 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Aline Olinda' AS nome, '(44) 99852-8564' AS telefone, CAST(542.02 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Ana Paula (Bico)' AS nome, '(44) 99885-1744' AS telefone, CAST(27.09 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Ana Paula Jorge' AS nome, '(44) 99959-0851' AS telefone, CAST(9.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Ana Paula Pereira (Coamo)' AS nome, '(44) 99846-0990' AS telefone, CAST(23.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Andrey Jacson' AS nome, '(44) 99853-5691' AS telefone, CAST(102.70 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Anthony' AS nome, '(44) 99934-2843' AS telefone, CAST(15.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Batista - Jaine' AS nome, '(44) 99900-8558' AS telefone, CAST(96.70 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Benedita A. Pinheiro - Dita' AS nome, '(44) 99720-5672' AS telefone, CAST(59.90 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Bianca Rafhaela' AS nome, '(44) 9921-1479' AS telefone, CAST(51.61 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Camilla Santiago' AS nome, '(44) 99713-9982' AS telefone, CAST(54.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Cassiana da Silva' AS nome, '(44) 99868-5225' AS telefone, CAST(318.37 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Cauã Elpidio de Oliveira' AS nome, '(44) 99850-7203' AS telefone, CAST(5.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Cesar pai do Julio' AS nome, '(44) 99756-3814' AS telefone, CAST(11.50 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Claudete Andre Pimenta Mendes' AS nome, '(44) 99885-0453' AS telefone, CAST(37.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Claudinei Theodoro' AS nome, '(41) 9946-9325' AS telefone, CAST(49.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Cleide Boina' AS nome, '(44) 99725-5299' AS telefone, CAST(131.44 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Daiane Amaral' AS nome, '(44) 99966-4361' AS telefone, CAST(337.22 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'David Henrique Campos' AS nome, '(44) 9976-4160' AS telefone, CAST(28.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Débora Cristina Ribeiro Gonçalves (Conselho)' AS nome, '(44) 99995-3096' AS telefone, CAST(1.27 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Dirlei Antunes (Misturinha)' AS nome, '(44) 99883-4193' AS telefone, CAST(127.75 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Domênica de Souza' AS nome, '(44) 99980-6345' AS telefone, CAST(187.08 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Edinha Tavares' AS nome, '(44) 99906-7464' AS telefone, CAST(81.98 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Edinho' AS nome, '(41) 99824-3610' AS telefone, CAST(26.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Edna Teodoro dos Santos - Junior Pipoca' AS nome, '(44) 99820-8444' AS telefone, CAST(34.59 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Eduardo Marcelo Umbelino' AS nome, '(44) 99881-3135' AS telefone, CAST(18.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Eduardo Souza' AS nome, '(44) 99925-4075' AS telefone, CAST(130.99 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Eliane Aparecida Baguete Lopes (Feirinha)' AS nome, '(44) 99950-8617' AS telefone, CAST(7.36 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Eliel Justino de Souza' AS nome, '(44) 99965-2644' AS telefone, CAST(44.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Emerson (Baiano)' AS nome, '(44) 99702-9058' AS telefone, CAST(423.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Emerson dos Santos (Nene)' AS nome, '(44) 99960-5782' AS telefone, CAST(5.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Esteffany Vitoria' AS nome, '(44) 99992-4414' AS telefone, CAST(254.55 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Ester Themistocles' AS nome, '(44) 99903-7462' AS telefone, CAST(334.97 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Everton (irmão da Caila)' AS nome, '(44) 99712-4552' AS telefone, CAST(15.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Everton do Jiro' AS nome, '(44) 99943-7117' AS telefone, CAST(54.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Everton Lucas' AS nome, '(44) 99770-7560' AS telefone, CAST(42.90 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Feche de Lenha' AS nome, '(44) 12345-1234' AS telefone, CAST(6.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Fernanda Piza' AS nome, '(44) 99998-4182' AS telefone, CAST(419.22 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Fernanda Ventura' AS nome, '(44) 99711-1070' AS telefone, CAST(32.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Fernando Artiles' AS nome, '(44) 99898-5940' AS telefone, CAST(500.57 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Flavia Nair Paulo' AS nome, '(44) 99979-1547' AS telefone, CAST(1859.03 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Fran Pertenelli' AS nome, '(44) 99734-1057' AS telefone, CAST(305.53 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Frank Santos' AS nome, '(44) 99847-2323' AS telefone, CAST(57.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Gabriela Evangelista Costa' AS nome, '(44) 99911-6911' AS telefone, CAST(28.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Gaby' AS nome, '(44) 99950-8668' AS telefone, CAST(55.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Geovana' AS nome, '(44) 99745-6414' AS telefone, CAST(87.80 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Gilmar Rodrigues Fernades' AS nome, '(44) 99817-3516' AS telefone, CAST(41.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Givanilda Schuindts' AS nome, '(44) 99980-2930' AS telefone, CAST(66.30 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Gleicymaira' AS nome, '(44) 9737-6674' AS telefone, CAST(86.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Gleycymeire' AS nome, '(44) 99740-9021' AS telefone, CAST(93.71 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Graciely Sangy Salema' AS nome, '(44) 93300-8601' AS telefone, CAST(59.96 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Gustavo Lima Serafim' AS nome, '(44) 99998-4249' AS telefone, CAST(76.80 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Hediane Ventura' AS nome, '(44) 99713-3149' AS telefone, CAST(42.81 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Hellen' AS nome, '(44) 9839-6067' AS telefone, CAST(120.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Heloisa' AS nome, '(44) 99757-6299' AS telefone, CAST(5.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Ingridy Mikaely' AS nome, '(44) 99840-3580' AS telefone, CAST(271.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Irene Pereira de Oliveira' AS nome, '(44) 99909-7883' AS telefone, CAST(71.49 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Itacir de Souza Campos' AS nome, '(44) 99919-4194' AS telefone, CAST(63.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Ivone Bergossi' AS nome, '(44) 99996-3134' AS telefone, CAST(71.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Janaina Clemente da Silva' AS nome, '(44) 99843-3832' AS telefone, CAST(27.99 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Jessyca Candido de Araujo (Célio)' AS nome, '(44) 99858-7329' AS telefone, CAST(22.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Jheiny Picanso' AS nome, '(44) 99839-4302' AS telefone, CAST(81.40 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Jhonata Willians de Oliveira' AS nome, '(44) 99960-4281' AS telefone, CAST(78.40 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Joelcio - Marcia' AS nome, '(44) 99867-8027' AS telefone, CAST(939.53 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'José Antônio (Zé da Lia)' AS nome, '(44) 99727-4018' AS telefone, CAST(51.22 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Josiel Amaral Cunha' AS nome, '(44) 99809-9643' AS telefone, CAST(39.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Julia Boina' AS nome, '(44) 99996-2826' AS telefone, CAST(54.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Junior Nogueira / Stefhany' AS nome, '(44) 99804-9237' AS telefone, CAST(4.80 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Kalliana' AS nome, '(44) 99824-2364' AS telefone, CAST(25.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Kauane Ap. da Silva' AS nome, '(44) 99827-5638' AS telefone, CAST(437.50 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Kawan' AS nome, '(44) 99122-2779' AS telefone, CAST(67.90 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Kelly Paluch / Janderson' AS nome, '(41) 99621-3436' AS telefone, CAST(123.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Késia Neves' AS nome, '(44) 99732-1243' AS telefone, CAST(577.62 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Ketlin' AS nome, '(44) 9703-5007' AS telefone, CAST(160.99 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Leiziane Rodrigues Avelar' AS nome, '(44) 99744-9339' AS telefone, CAST(64.50 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Leomar Delfino' AS nome, '(44) 99815-7068' AS telefone, CAST(32.01 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Letycia França' AS nome, '(44) 99978-8815' AS telefone, CAST(72.26 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Lorena Paulo' AS nome, '(44) 9701-2825' AS telefone, CAST(44.99 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Luana Gabriel Valentina' AS nome, '(44) 99969-7205' AS telefone, CAST(9.99 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Lucas Gabriel Antunes' AS nome, '(44) 99905-9697' AS telefone, CAST(122.45 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Luciana Polido' AS nome, '(44) 99876-6370' AS telefone, CAST(9.58 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Luciano Matias Pedroso' AS nome, '(44) 9987-4034' AS telefone, CAST(106.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Marcos dos Santos Leite' AS nome, '(44) 9830-8384' AS telefone, CAST(75.49 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Maria Angela' AS nome, '(44) 99904-9179' AS telefone, CAST(52.50 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Maria de Fatima de Oliveira' AS nome, '(44) 99804-0036' AS telefone, CAST(28.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Maria Monica Bonifácio' AS nome, '(44) 99877-3629' AS telefone, CAST(224.93 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Maria Rita Baia' AS nome, '(44) 99739-1498' AS telefone, CAST(25.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Matheus Alixandre Rodrigues' AS nome, '(44) 99809-2836' AS telefone, CAST(58.97 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Micheli Fernanda A. I. Lopes' AS nome, '(44) 99999-9864' AS telefone, CAST(21.99 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Milene Oliveira Bezerra dos Nascimento dos Reis' AS nome, '(44) 99945-8846' AS telefone, CAST(56.90 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Moisés Vesphal' AS nome, '(44) 99983-0635' AS telefone, CAST(17.99 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Murilo Bergossi' AS nome, '(44) 99713-1189' AS telefone, CAST(150.30 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Murilo Rodrigues de Lima / Durval' AS nome, '(44) 9995-1795' AS telefone, CAST(42.80 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Nedson da Silva' AS nome, '(44) 99809-5834' AS telefone, CAST(288.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Neia da Loja' AS nome, '(44) 99858-5357' AS telefone, CAST(33.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Paloma Silva' AS nome, '(44) 99760-1773' AS telefone, CAST(76.16 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Paschoal Cafisso' AS nome, '(44) 99104-4749' AS telefone, CAST(31.90 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Patricia Goes' AS nome, '(44) 99999-7334' AS telefone, CAST(279.54 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Pref. Munic. Corumb. do Sul' AS nome, '(44) 3277-1153' AS telefone, CAST(256.84 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Rafael Borges' AS nome, '(44) 99768-1608' AS telefone, CAST(10.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Renaldo Galli' AS nome, '(44) 9922-2499' AS telefone, CAST(59.80 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Ricardo Carvalho' AS nome, '(44) 99955-1749' AS telefone, CAST(29.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Ricardo Diniz' AS nome, '(44) 8827-7639' AS telefone, CAST(260.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Rildo Aparecido Marins' AS nome, '(44) 9725-8858' AS telefone, CAST(37.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Roberta Thaila Ap. de Oliveira' AS nome, '(44) 99717-4298' AS telefone, CAST(17.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Roberto Davanço - Juninho Zoinho' AS nome, '(44) 99803-9617' AS telefone, CAST(121.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Rodrigo Costa' AS nome, '(44) 99960-8725' AS telefone, CAST(104.60 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Rosana Moreira Bueno' AS nome, '(00) 0000-0000' AS telefone, CAST(99.37 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Rosane Camilo' AS nome, '(41) 99832-9757' AS telefone, CAST(27.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Rosangela Baguete' AS nome, '(44) 9909-1052' AS telefone, CAST(46.80 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Ruan' AS nome, '(44) 99754-3173' AS telefone, CAST(129.50 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Samuel Morais' AS nome, '(44) 99737-4694' AS telefone, CAST(40.45 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Sandro Fernandes de Souza' AS nome, '(44) 99905-2113' AS telefone, CAST(61.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Seu Luiz' AS nome, '(44) 99114-1213' AS telefone, CAST(50.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Sidneia' AS nome, '(44) 99973-0903' AS telefone, CAST(8.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Simone Santana' AS nome, '(41) 99846-4475' AS telefone, CAST(21.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Tais Robust' AS nome, '(44) 99917-8034' AS telefone, CAST(58.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Talita' AS nome, '(44) 99702-3179' AS telefone, CAST(52.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Tarcízio Paulo' AS nome, '(44) 99917-3210' AS telefone, CAST(997.19 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Thais Viviane Balbino Morais' AS nome, '(44) 99930-0869' AS telefone, CAST(286.27 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Thiago Barbosa' AS nome, '(44) 99825-4129' AS telefone, CAST(71.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Valdineia Aparecida de Oliveira' AS nome, '(44) 99956-5937' AS telefone, CAST(60.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Valdomiro Lacos' AS nome, '(44) 99813-6327' AS telefone, CAST(45.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Valquíria Balbino' AS nome, '(44) 99953-7043' AS telefone, CAST(29.46 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Vanessa (Loja Rosa Liz)' AS nome, '(44) 99826-9528' AS telefone, CAST(163.12 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Vanessa Mendes' AS nome, '(44) 99991-2013' AS telefone, CAST(164.50 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Vania da Silva - Cresol' AS nome, '(44) 99944-0610' AS telefone, CAST(61.80 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Vera Lúcia de Souza' AS nome, '(44) 99986-5566' AS telefone, CAST(26.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Vidal' AS nome, '(44) 9816-3129' AS telefone, CAST(98.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Vitor Kauã de Oliveira Souza  - Sobrinho' AS nome, '(44) 99887-3063' AS telefone, CAST(74.90 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Vózinha' AS nome, '(44) 99993-8188' AS telefone, CAST(68.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Weliton Costa' AS nome, '(44) 99973-7103' AS telefone, CAST(44.00 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Willian Mariano' AS nome, '(44) 99963-9760' AS telefone, CAST(84.80 AS DECIMAL(15,2)) AS valor
UNION ALL
  SELECT 'Zeli Lopes' AS nome, '(44) 99996-1307' AS telefone, CAST(56.00 AS DECIMAL(15,2)) AS valor
) AS d
JOIN clientes c ON c.nome = d.nome AND c.telefone = d.telefone;
COMMIT;

-- Total: 320 clientes únicos; 144 contas a receber.
