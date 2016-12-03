export MYSQL_PASSWORD=${MYSQL_PASSWORD:-hail_ukraine}
export INSTALL_WITH_EXAMPLE_DATA=${INSTALL_WITH_EXAMPLE_DATA:-false}
export SERVER_NAME=${SERVER_NAME:-localhost}

set -e

if [[ "$INSTALL_WITH_EXAMPLE_DATA" -eq "true" ]]; then
    echo "(!) Warning: doing aggressive install (assuming empty box just for us and being rude in actions)"
fi;

sudo apt-get update

# set some mysql password so we can proceed without interactive prompt for it
sudo debconf-set-selections <<< "mysql-server mysql-server/root_password password $MYSQL_PASSWORD"
sudo debconf-set-selections <<< "mysql-server mysql-server/root_password_again password $MYSQL_PASSWORD"

sudo apt-get -y install mysql-server
sudo apt-get install -y git python-setuptools python-dev libavcodec-dev libavformat-dev libswscale-dev libjpeg62 libjpeg62-dev libfreetype6 libfreetype6-dev apache2 libapache2-mod-wsgi mysql-server mysql-client libmysqlclient-dev gfortran
sudo apt-get install -y libav-tools

sudo easy_install -U SQLAlchemy pillow wsgilog mysql-python munkres parsedatetime argparse
sudo easy_install -U numpy

git clone https://github.com/cvondrick/turkic.git
git clone https://github.com/cluePrints/pyvision.git
git clone https://github.com/cluePrints/vatic.git

cd turkic
sudo python setup.py install
cd ..

# without this bit cython pyvision compilation fails
sudo apt-get install -y g++ make
sudo easy_install pip
sudo pip install cython==0.20

cd pyvision
sudo python setup.py install
cd ..

if [[ "$INSTALL_WITH_EXAMPLE_DATA" -eq "true" ]]; then
    sudo cp /etc/apache2/mods-available/headers.load /etc/apache2/mods-enabled
    mysql -u root -p$MYSQL_PASSWORD -e 'create database vatic;'

    sudo bash -c "cat > /etc/apache2/sites-enabled/000-default" <<EOF
    WSGIDaemonProcess www-data
    WSGIProcessGroup www-data

    <VirtualHost *:80>
        ServerName $SERVER_NAME
        DocumentRoot /home/vagrant/vatic/public

        WSGIScriptAlias /server /home/vagrant/vatic/server.py
        CustomLog /var/log/apache2/access.log combined
    </VirtualHost>

EOF

    sudo cp vatic/config.py-example vatic/config.py
    sudo sed -ibak "s/root@localhost/root:$MYSQL_PASSWORD@localhost/g" vatic/config.py

    sudo apache2ctl graceful

    cd vatic
    turkic setup --database
    turkic setup --public-symlink
    turkic status --verify

    # setup demo dataset
    mkdir -p /home/vagrant/vagrant_data/example
    wget http://techslides.com/demos/sample-videos/small.mp4 -O /home/vagrant/vagrant_data/small.mp4
    turkic extract /home/vagrant/vagrant_data/small.mp4 /home/vagrant/vagrant_data/example/
    turkic load example_id /home/vagrant/vagrant_data/example/ example_label1 example_label2 example_label3 --offline

    wget -qO- "http://localhost:80/?id=1&hitId=offline" > /dev/null \
        && echo "We are rather done. Go to http://localhost:8080/?id=1&hitId=offline and see how this thing works" \
        || echo "Something went rather wrong and now you'll have to troubleshoot"
else
    echo "*****************************************************"
    echo "*** Please consult README to finish installation. ***"
    echo "*****************************************************"
fi;
