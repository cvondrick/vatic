restart :
	touch server.py

install :
	apt-get install python-setuptools
	easy_install -U turkic
	wget http://mit.edu/vondrick/code/pyvision.tar.gz
	tar xzvf pyvision.tar.gz
	cd pyvision-*
	apt-get install python-dev
	apt-get install libavcodec-dev libavformat-dev libswscale-dev
	easy_install -U cython
	easy_install -U numpy
	python setup.py install
	apt-get install apache2
	apt-get install mysql-server-5.1 mysql-client-5.1
	apt-get install libmysqlclient-dev
	easy_install -U mysql-python
	@echo ""
	@echo "Please consult README to finish installation."

bundle :
	tar czvf vatic.tar.gz `git ls-files`
