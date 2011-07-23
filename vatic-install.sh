apt-get install -y git
apt-get install -y python-setuptools

git clone https://github.com/cvondrick/turkic.git
cd turkic
easy_install -U SQLAlchemy
easy_install -U wsgilog
python setup.py install
cd ..

git clone https://github.com/cvondrick/pyvision.git
cd pyvision
apt-get install -y python-dev
apt-get install -y libavcodec-dev libavformat-dev libswscale-dev
apt-get install -y libjpeg libjpeg-dev
apt-get install -y libfreetype6 libfreetype6-dev
easy_install -U pil
easy_install -U cython
easy_install -U numpy
python setup.py install
cd ..

apt-get install -y apache2
apt-get install -y libapache2-mod-wsgi

apt-get install -y mysql-server-5.1 mysql-client-5.1
apt-get install -y libmysqlclient-dev
easy_install -U mysql-python

easy_install -U munkres
easy_install -U parsedatetime

git clone https://github.com/cvondrick/vatic.git

echo "*****************************************************"
echo "*** Please consult README to finish installation. ***"
echo "*****************************************************"
